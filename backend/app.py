#!/usr/bin/env python3
"""
Energy Trading Platform - IoT Simulation Backend with Affordable ₹5/kWh Pricing
"""

from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
import random
import math
import time
import threading
from datetime import datetime, timedelta

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], allow_headers=["Content-Type"], methods=["GET", "POST", "OPTIONS"])

# ===== GLOBAL DATA STORAGE =====
SOLAR_DEVICES = []
ENERGY_READINGS = []
MARKET_DATA = {}
PRICE_HISTORY = []

# ===== CURRENCY CONVERSION SERVICE =====

class CurrencyConverter:
    def __init__(self):
        self.eth_to_inr_rate = 200000
        self.last_updated = None

    def get_eth_to_inr_rate(self):
        base_rate = 200000
        hour = datetime.now().hour
        if 9 <= hour <= 17:
            time_multiplier = 1.02
        elif 0 <= hour <= 6:
            time_multiplier = 0.98
        else:
            time_multiplier = 1.0
        volatility = random.uniform(-0.025, 0.025)
        self.eth_to_inr_rate = base_rate * time_multiplier * (1 + volatility)
        self.last_updated = datetime.now()
        return self.eth_to_inr_rate

    def eth_to_inr(self, eth_amount):
        if not self.last_updated or (datetime.now() - self.last_updated).seconds > 300:
            self.get_eth_to_inr_rate()
        return eth_amount * self.eth_to_inr_rate

    def inr_to_eth(self, inr_amount):
        if not self.last_updated or (datetime.now() - self.last_updated).seconds > 300:
            self.get_eth_to_inr_rate()
        return inr_amount / self.eth_to_inr_rate

currency_converter = CurrencyConverter()

# ===== SOLAR ENERGY SIMULATION =====

class SolarSimulator:
    @staticmethod
    def get_time_intensity():
        now = datetime.now()
        hour = now.hour + now.minute / 60.0
        if hour < 6 or hour > 18:
            return 0.0
        day_progress = (hour - 6) / 12
        return max(0, math.sin(day_progress * math.pi))

    @staticmethod
    def get_weather_conditions():
        month = datetime.now().month
        if month in [12,1,2]:
            weights = {'sunny':0.6,'partly_cloudy':0.3,'cloudy':0.1,'overcast':0.0}
        elif month in [6,7,8,9]:
            weights = {'sunny':0.2,'partly_cloudy':0.3,'cloudy':0.3,'overcast':0.2}
        else:
            weights = {'sunny':0.5,'partly_cloudy':0.3,'cloudy':0.15,'overcast':0.05}
        impacts = {'sunny':1.0,'partly_cloudy':0.75,'cloudy':0.5,'overcast':0.25}
        weather = random.choices(list(weights.keys()), weights=list(weights.values()))[0]
        return weather, impacts[weather]

    @staticmethod
    def get_temperature():
        month = datetime.now().month
        hour = datetime.now().hour
        monthly = {1:20,2:25,3:30,4:35,5:38,6:35,7:30,8:28,9:30,10:32,11:28,12:22}
        base = monthly[month]
        if 6<=hour<=10:
            var = random.uniform(-5,0)
        elif 11<=hour<=16:
            var = random.uniform(0,8)
        elif 17<=hour<=20:
            var = random.uniform(-2,3)
        else:
            var = random.uniform(-8,-3)
        return base + var

    @staticmethod
    def generate_device_reading(device):
        intensity = SolarSimulator.get_time_intensity()
        weather, weather_mul = SolarSimulator.get_weather_conditions()
        temp = SolarSimulator.get_temperature()
        max_power = device['capacity_kw'] * device['efficiency']
        current = max_power * intensity * weather_mul
        if temp>35:
            eff = max(0.7,0.95-(temp-35)*0.01)
            current *= eff
        elif temp<10:
            current *= 0.9
        current *= (1 + random.uniform(-0.15,0.15))
        energy = current
        return {
            'device_id': device['id'],
            'timestamp': datetime.now().isoformat(),
            'current_power_kw': round(current,3),
            'energy_produced_kwh': round(energy,3),
            'weather_condition': weather,
            'temperature_celsius': round(temp,1),
            'sunlight_intensity': round(intensity,2),
            'location': device['location']
        }

# ===== MARKET SIMULATION =====

def update_data():
    global ENERGY_READINGS, MARKET_DATA, PRICE_HISTORY
    readings = [SolarSimulator.generate_device_reading(d) for d in SOLAR_DEVICES]
    ENERGY_READINGS = readings
    total_supply = sum(r['energy_produced_kwh'] for r in readings)

    # Affordable pricing: ₹5/kWh
    # 1 ETH ≈ ₹400,871 → price_eth = 5/400871 ≈ 0.0000125
    base_price_eth = 0.0000125
    eth_price = base_price_eth * random.uniform(0.9,1.1)
    inr_price = currency_converter.eth_to_inr(eth_price)

    MARKET_DATA = {
        'timestamp': datetime.now().isoformat(),
        'current_price_eth': round(eth_price,8),
        'current_price_inr': round(inr_price,2),
        'eth_to_inr_rate': currency_converter.eth_to_inr_rate,
        'total_supply_kwh': round(total_supply,2),
        'estimated_demand_kwh': round(total_supply*1.2,2),
        'active_producers': len([r for r in readings if r['current_power_kw']>0]),
        'total_producers': len(SOLAR_DEVICES)
    }

    PRICE_HISTORY.append({
        'timestamp': datetime.now().isoformat(),
        'price_eth': eth_price,
        'price_inr': round(inr_price,2)
    })
    if len(PRICE_HISTORY)>500:
        PRICE_HISTORY = PRICE_HISTORY[-500:]

    print(f"[{datetime.now().strftime('%H:%M:%S')}] Price: {eth_price:.8f} ETH (₹{inr_price:.2f})")
    return readings

def background_data_loop():
    while True:
        try:
            update_data()
            time.sleep(30)
        except Exception as e:
            print("Background loop error:", e)
            time.sleep(30)

# ===== INITIALIZATION =====

def initialize_demo_devices():
    global SOLAR_DEVICES
    SOLAR_DEVICES = [
        {'id':'SOLAR_001','owner':'0x742d35Cc123C6f5E5b9F3c3123456789abcdef00','location':'Delhi NCR','capacity_kw':5.0,'efficiency':0.18},
        {'id':'SOLAR_002','owner':'0x851b42Dd123E7f8F9c4D3123456789abcdef11','location':'Mumbai','capacity_kw':7.5,'efficiency':0.20},
        {'id':'SOLAR_003','owner':'0x963f53Ee234F9g0G5e6E4123456789abcdef22','location':'Bangalore','capacity_kw':3.5,'efficiency':0.17},
        {'id':'SOLAR_004','owner':'0xa74e64Ff345G0h1H6f7F5123456789abcdef33','location':'Jaipur','capacity_kw':6.0,'efficiency':0.19},
        {'id':'SOLAR_005','owner':'0xb85f75Gg456H1i2I7g8G6123456789abcdef44','location':'Kolkata','capacity_kw':4.5,'efficiency':0.16}
    ]
    print(f"Initialized {len(SOLAR_DEVICES)} solar devices")

# ===== API ENDPOINTS =====

@app.route('/api/health')
@cross_origin()
def health_check():
    return jsonify({'success':True,'status':'Running','timestamp':datetime.now().isoformat()})

@app.route('/api/devices')
@cross_origin()
def get_devices():
    return jsonify({'success':True,'devices':SOLAR_DEVICES})

@app.route('/api/readings/current')
@cross_origin()
def get_current_readings():
    readings = update_data()
    return jsonify({'success':True,'readings':readings})

@app.route('/api/market/data')
@cross_origin()
def get_market_data():
    return jsonify({'success':True,'market_data':MARKET_DATA})

@app.route('/api/currency/eth-inr-rate')
@cross_origin()
def get_rate():
    rate = currency_converter.get_eth_to_inr_rate()
    return jsonify({'success':True,'eth_to_inr_rate':rate,'last_updated':currency_converter.last_updated.isoformat()})

@app.route('/api/currency/convert')
@cross_origin()
def convert_currency():
    eth_amt = request.args.get('eth',type=float)
    inr_amt = request.args.get('inr',type=float)
    if eth_amt is not None:
        return jsonify({'success':True,'inr':round(currency_converter.eth_to_inr(eth_amt),2)})
    if inr_amt is not None:
        return jsonify({'success':True,'eth':round(currency_converter.inr_to_eth(inr_amt),8)})
    return jsonify({'success':False,'error':'Provide eth or inr'}),400

@app.route('/api/analytics/summary')
@cross_origin()
def analytics_summary():
    total_capacity = sum(d['capacity_kw'] for d in SOLAR_DEVICES)
    latest = update_data()
    production = sum(r['energy_produced_kwh'] for r in latest)
    return jsonify({
        'success':True,
        'summary':{
            'total_devices':len(SOLAR_DEVICES),
            'current_production_kwh':round(production,2),
            'market_price_eth':MARKET_DATA['current_price_eth'],
            'market_price_inr':MARKET_DATA['current_price_inr']
        }
    })

# ===== SERVER STARTUP =====

def start_server():
    print("Starting Energy Trading Backend...")
    initialize_demo_devices()
    currency_converter.get_eth_to_inr_rate()
    update_data()
    thread = threading.Thread(target=background_data_loop,daemon=True)
    thread.start()
    app.run(host='0.0.0.0',port=5000,debug=True,threaded=True)

if __name__ == '__main__':
    start_server()