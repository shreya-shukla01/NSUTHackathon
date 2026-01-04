from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import random
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

class SensorData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sensor_id: str
    sensor_type: str
    value: float
    unit: str
    location: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Alert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    alert_type: str
    severity: str
    location: str
    intent: str
    risk_score: float
    description: str
    status: str = "active"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TrainStatus(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    train_id: str
    speed: float
    location: str
    status: str
    last_update: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class IntentAnalysisRequest(BaseModel):
    vibration: float
    sound_level: float
    temperature: float
    visual_motion: bool

class IntentAnalysisResponse(BaseModel):
    intent: str
    risk_score: float
    confidence: float
    recommendation: str

@api_router.get("/")
async def root():
    return {"message": "IntentGuard API Active", "status": "operational"}

@api_router.get("/sensor-data", response_model=List[SensorData])
async def get_sensor_data(limit: int = 100):
    sensors = await db.sensor_data.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    for sensor in sensors:
        if isinstance(sensor['timestamp'], str):
            sensor['timestamp'] = datetime.fromisoformat(sensor['timestamp'])
    return sensors

@api_router.get("/sensor-data/latest")
async def get_latest_sensors():
    now = datetime.now(timezone.utc)
    vibration = random.uniform(2, 8)
    sound = random.uniform(40, 65)
    temp = random.uniform(25, 32)
    
    return {
        "vibration": {
            "value": round(vibration, 2),
            "unit": "g",
            "status": "normal" if vibration < 5 else "warning"
        },
        "sound": {
            "value": round(sound, 2),
            "unit": "dB",
            "status": "normal" if sound < 80 else "alert"
        },
        "temperature": {
            "value": round(temp, 2),
            "unit": "°C",
            "status": "normal" if temp < 35 else "warning"
        },
        "visual": {
            "motion_detected": random.choice([False, False, False, True]),
            "status": "monitoring"
        },
        "timestamp": now.isoformat()
    }

@api_router.post("/analyze-intent", response_model=IntentAnalysisResponse)
async def analyze_intent(request: IntentAnalysisRequest):
    try:
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=f"intent-analysis-{uuid.uuid4()}",
            system_message="You are an AI railway safety expert. Analyze sensor data and classify the intent behind anomalies. Respond in JSON format only with intent, risk_score (0-100), confidence (0-100), and recommendation."
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(
            text=f"""Analyze this railway track sensor data:
- Vibration: {request.vibration}g (normal: 2-5g)
- Sound Level: {request.sound_level}dB (normal: 40-70dB)
- Temperature: {request.temperature}°C (normal: 20-35°C)
- Visual Motion: {request.visual_motion}

Classify intent as: Normal, Maintenance, Accidental, or Sabotage.
Provide risk_score (0-100), confidence (0-100), and recommendation.
Respond ONLY with JSON format: {{"intent": "...", "risk_score": 0, "confidence": 0, "recommendation": "..."}}"""
        )
        
        response = await chat.send_message(user_message)
        import json
        result = json.loads(response.strip())
        
        return IntentAnalysisResponse(**result)
    except Exception as e:
        logging.error(f"Intent analysis error: {e}")
        risk = 50 if request.vibration > 10 or request.sound_level > 80 else 20
        return IntentAnalysisResponse(
            intent="Normal" if risk < 30 else "Maintenance",
            risk_score=risk,
            confidence=75,
            recommendation="Continue monitoring" if risk < 50 else "Schedule inspection"
        )

@api_router.get("/alerts", response_model=List[Alert])
async def get_alerts(status: Optional[str] = None, limit: int = 50):
    query = {"status": status} if status else {}
    alerts = await db.alerts.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    for alert in alerts:
        if isinstance(alert['timestamp'], str):
            alert['timestamp'] = datetime.fromisoformat(alert['timestamp'])
    return alerts

@api_router.post("/alerts", response_model=Alert)
async def create_alert(alert: Alert):
    alert_dict = alert.model_dump()
    alert_dict['timestamp'] = alert_dict['timestamp'].isoformat()
    await db.alerts.insert_one(alert_dict)
    return alert

@api_router.patch("/alerts/{alert_id}")
async def update_alert_status(alert_id: str, status: str):
    result = await db.alerts.update_one(
        {"id": alert_id},
        {"$set": {"status": status}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"success": True, "alert_id": alert_id, "status": status}

@api_router.get("/trains", response_model=List[TrainStatus])
async def get_trains():
    trains = await db.trains.find({}, {"_id": 0}).to_list(100)
    for train in trains:
        if isinstance(train['last_update'], str):
            train['last_update'] = datetime.fromisoformat(train['last_update'])
    return trains

@api_router.post("/trains/halt/{train_id}")
async def halt_train(train_id: str):
    result = await db.trains.update_one(
        {"train_id": train_id},
        {"$set": {"status": "halted", "speed": 0, "last_update": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Train not found")
    return {"success": True, "train_id": train_id, "action": "halted"}

@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    total_alerts = await db.alerts.count_documents({})
    active_alerts = await db.alerts.count_documents({"status": "active"})
    critical_alerts = await db.alerts.count_documents({"severity": "critical", "status": "active"})
    
    recent_sabotage = await db.alerts.count_documents({
        "intent": "Sabotage",
        "timestamp": {"$gte": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()}
    })
    
    trains = await db.trains.count_documents({})
    
    return {
        "total_alerts": total_alerts,
        "active_alerts": active_alerts,
        "critical_alerts": critical_alerts,
        "incidents_prevented": random.randint(15, 25),
        "system_uptime": 99.8,
        "monitored_track_km": 1247,
        "active_trains": trains,
        "sabotage_attempts_blocked": recent_sabotage,
        "average_response_time": random.uniform(2, 5)
    }

@api_router.get("/digital-twin/tracks")
async def get_track_data():
    tracks = [
        {"id": "track-1", "name": "Delhi-Mumbai Mainline", "start": [28.6139, 77.2090], "end": [19.0760, 72.8777], "status": "safe", "risk_level": 15},
        {"id": "track-2", "name": "Chennai-Bangalore Route", "start": [13.0827, 80.2707], "end": [12.9716, 77.5946], "status": "monitoring", "risk_level": 45},
        {"id": "track-3", "name": "Kolkata-Howrah Bridge", "start": [22.5726, 88.3639], "end": [22.5958, 88.2636], "status": "safe", "risk_level": 10},
        {"id": "track-4", "name": "Jaipur-Ajmer Line", "start": [26.9124, 75.7873], "end": [26.4499, 74.6399], "status": "alert", "risk_level": 85},
    ]
    return tracks

@api_router.post("/drone/dispatch")
async def dispatch_drone(location: str, alert_id: str):
    await asyncio.sleep(1)
    return {
        "success": True,
        "drone_id": f"DRONE-{random.randint(100, 999)}",
        "location": location,
        "eta": random.randint(2, 5),
        "alert_id": alert_id,
        "status": "en_route"
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db():
    logger.info("Initializing database with sample data...")
    if await db.trains.count_documents({}) == 0:
        trains = [
            {"id": str(uuid.uuid4()), "train_id": "RJ-2401", "speed": 95.0, "location": "Delhi-Mumbai KM 245", "status": "running", "last_update": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "train_id": "DL-1203", "speed": 110.0, "location": "Chennai-Bangalore KM 89", "status": "running", "last_update": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "train_id": "MB-5501", "speed": 0.0, "location": "Kolkata Station", "status": "stopped", "last_update": datetime.now(timezone.utc).isoformat()},
        ]
        await db.trains.insert_many(trains)
    
    if await db.alerts.count_documents({}) == 0:
        alerts = [
            {"id": str(uuid.uuid4()), "alert_type": "Sabotage", "severity": "critical", "location": "Delhi-Mumbai KM 245", "intent": "Sabotage", "risk_score": 92, "description": "Unusual vibration pattern detected with tool-like sounds", "status": "active", "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()},
            {"id": str(uuid.uuid4()), "alert_type": "Maintenance", "severity": "warning", "location": "Chennai-Bangalore KM 89", "intent": "Maintenance", "risk_score": 45, "description": "Scheduled maintenance activity detected", "status": "acknowledged", "timestamp": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()},
        ]
        await db.alerts.insert_many(alerts)
    logger.info("Database initialized")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()