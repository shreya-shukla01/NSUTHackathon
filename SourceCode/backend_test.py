import requests
import sys
import json
from datetime import datetime

class IntentGuardAPITester:
    def __init__(self, base_url="https://tracksafe-7.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })

            return success, response.json() if success and response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_sensor_data_latest(self):
        """Test latest sensor data endpoint"""
        return self.run_test("Latest Sensor Data", "GET", "sensor-data/latest", 200)

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        return self.run_test("Dashboard Stats", "GET", "dashboard/stats", 200)

    def test_alerts_endpoint(self):
        """Test alerts endpoint"""
        return self.run_test("Get Alerts", "GET", "alerts", 200)

    def test_alerts_with_params(self):
        """Test alerts endpoint with parameters"""
        return self.run_test("Get Active Alerts", "GET", "alerts?status=active&limit=5", 200)

    def test_trains_endpoint(self):
        """Test trains endpoint"""
        return self.run_test("Get Trains", "GET", "trains", 200)

    def test_digital_twin_tracks(self):
        """Test digital twin tracks endpoint"""
        return self.run_test("Digital Twin Tracks", "GET", "digital-twin/tracks", 200)

    def test_analyze_intent(self):
        """Test AI intent analysis endpoint"""
        test_data = {
            "vibration": 6.5,
            "sound_level": 75.0,
            "temperature": 28.5,
            "visual_motion": True
        }
        return self.run_test("AI Intent Analysis", "POST", "analyze-intent", 200, test_data)

    def test_drone_dispatch(self):
        """Test drone dispatch endpoint"""
        return self.run_test("Drone Dispatch", "POST", "drone/dispatch?location=Test Location KM 100&alert_id=test-alert-123", 200)

    def test_create_alert(self):
        """Test creating a new alert"""
        test_alert = {
            "alert_type": "Test",
            "severity": "warning",
            "location": "Test Location",
            "intent": "Testing",
            "risk_score": 45.0,
            "description": "Test alert for API testing",
            "status": "active"
        }
        return self.run_test("Create Alert", "POST", "alerts", 200, test_alert)

    def test_sensor_data_history(self):
        """Test sensor data history endpoint"""
        return self.run_test("Sensor Data History", "GET", "sensor-data?limit=10", 200)

def main():
    print("🚂 IntentGuard Railway Safety API Testing")
    print("=" * 50)
    
    tester = IntentGuardAPITester()
    
    # Test all endpoints
    test_methods = [
        tester.test_root_endpoint,
        tester.test_sensor_data_latest,
        tester.test_dashboard_stats,
        tester.test_alerts_endpoint,
        tester.test_alerts_with_params,
        tester.test_trains_endpoint,
        tester.test_digital_twin_tracks,
        tester.test_analyze_intent,
        tester.test_drone_dispatch,
        tester.test_create_alert,
        tester.test_sensor_data_history
    ]
    
    for test_method in test_methods:
        try:
            test_method()
        except Exception as e:
            print(f"❌ Test method failed: {e}")
            tester.failed_tests.append({
                "test": test_method.__name__,
                "error": str(e)
            })
    
    # Print summary
    print(f"\n📊 Test Summary")
    print("=" * 30)
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Tests failed: {len(tester.failed_tests)}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"  - {failure.get('test', 'Unknown')}: {failure.get('error', failure.get('response', 'Unknown error'))}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())