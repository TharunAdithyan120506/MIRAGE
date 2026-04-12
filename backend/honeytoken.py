"""
MIRAGE Honeytoken Factory — Faker-generated fake data
PRD Section 4.2.3 and 5.1
Generates: 500 users, 2000 transactions, fake credentials
All data is deterministic (seeded) so it's consistent across restarts.
"""
import random
from faker import Faker
from faker.providers import bank, internet, phone_number, person

fake = Faker("en_IN")
fake.seed_instance(42)
random.seed(42)

# ── Fake AWS / System Credentials ────────────────────────────────────────────
FAKE_CONFIG = {
    "AWS_ACCESS_KEY_ID":      "AKIAIOSFODNN7EXAMPLE",
    "AWS_SECRET_ACCESS_KEY":  "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "DB_PASSWORD":            "Pr0d_S3cur3DB!2024",
    "JWT_SECRET":             "mirage_jwt_supersecret_9f3a1b2c4d5e6f7a",
    "STRIPE_KEY":             "sk_live_51HZ9xBKLmN2YPQ7aFAKEKEYDONOTUSE",
    "INTERNAL_API_KEY":       "int_api_8f2d3e1c4b5a69f7e8d2c3b4a5f6e7d8",
    "REDIS_PASSWORD":         "R3d!sP@ssw0rd_2024",
    "SMTP_PASSWORD":          "Sm7p_1337_P@ss!",
    "DB_HOST":                "prod-rds.internal.securebank.in",
    "DB_NAME":                "securebank_prod",
    "DB_USER":                "admin",
    "ENVIRONMENT":            "production",
}

FAKE_ENV_FILE = """# SECUREBANK PRODUCTION ENVIRONMENT
# DO NOT COMMIT — INTERNAL USE ONLY

APP_ENV=production
APP_SECRET=mirage_app_secret_d3a4f5b6c7e8f9a0b1c2d3e4f5a6b7c8
APP_URL=https://securebank.in

# Database
DB_HOST=prod-rds.internal.securebank.in
DB_PORT=5432
DB_NAME=securebank_prod
DB_USER=admin
DB_PASSWORD=Pr0d_S3cur3DB!2024

# AWS
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=ap-south-1
S3_BUCKET=securebank-prod-statements

# Authentication
JWT_SECRET=mirage_jwt_supersecret_9f3a1b2c4d5e6f7a
JWT_EXPIRY=86400

# Payment Gateway
STRIPE_KEY=sk_live_51HZ9xBKLmN2YPQ7aFAKEKEYDONOTUSE
RAZORPAY_KEY_ID=rzp_live_FAKEKEY123456
RAZORPAY_KEY_SECRET=rzp_secret_FAKEKEY987654

# Redis
REDIS_HOST=redis.internal.securebank.in
REDIS_PORT=6379
REDIS_PASSWORD=R3d!sP@ssw0rd_2024

# SMTP
SMTP_HOST=smtp.securebank.in
SMTP_PORT=587
SMTP_USER=noreply@securebank.in
SMTP_PASSWORD=Sm7p_1337_P@ss!

# Internal Services
INTERNAL_API_KEY=int_api_8f2d3e1c4b5a69f7e8d2c3b4a5f6e7d8
WEBHOOK_SECRET=wh_secret_c4b5a6f7e8d9c0b1a2f3e4d5
"""

FAKE_PAYMENT_GATEWAY = {
    "merchant_id":      "MID_SECUREBANK_PROD_001",
    "merchant_key":     "rzp_live_FAKEKEY123456",
    "merchant_secret":  "rzp_secret_FAKEKEY987654",
    "gateway_url":      "https://api.razorpay.com/v1/payments",
    "webhook_secret":   "wh_secret_c4b5a6f7e8d9c0b1a2f3e4d5",
    "settlement_account": "HDFC_SETTLE_ACC_98765432",
    "note":             "Internal use only — do not share",
}

FAKE_INTERNAL_DOCS = {
    "title": "SecureBank Internal API Documentation v2.3",
    "classification": "INTERNAL — DO NOT DISTRIBUTE",
    "endpoints": [
        {"method": "GET",  "path": "/internal/users/export",      "auth": "Bearer token", "desc": "Export all users as CSV"},
        {"method": "POST", "path": "/internal/admin/reset-password","auth": "Bearer token", "desc": "Force-reset any user password"},
        {"method": "GET",  "path": "/internal/audit-log",          "auth": "Bearer token", "desc": "Full audit log access"},
        {"method": "POST", "path": "/internal/transactions/reverse","auth": "Bearer token", "desc": "Reverse any transaction"},
        {"method": "GET",  "path": "/internal/config",             "auth": "Bearer token", "desc": "Live config dump"},
        {"method": "POST", "path": "/internal/db/query",           "auth": "Bearer token", "desc": "Raw SQL query interface"},
    ],
    "slack_webhook": "https://hooks.slack.com/services/FAKE/FAKE/FAKEwebhookURLhere",
    "internal_kibana": "http://kibana.internal.securebank.in:5601",
}


def generate_users(count: int = 500) -> list[dict]:
    Faker.seed(42)
    f = Faker("en_IN")
    users = []
    for i in range(count):
        users.append({
            "id": i + 1,
            "name": f.name(),
            "email": f.email(),
            "phone": f.phone_number(),
            "aadhaar_last4": str(random.randint(1000, 9999)),
            "account_number": f"HDFC{random.randint(10000000, 99999999)}",
            "ifsc": f"HDFC0{random.randint(100000, 999999)}",
            "balance": round(random.uniform(1000, 500000), 2),
            "hashed_pw": f"$2b$12${''.join(random.choices('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP0123456789', k=53))}",
            "kyc_status": random.choice(["VERIFIED", "VERIFIED", "VERIFIED", "PENDING"]),
            "created_at": f.date_time_between(start_date="-3y", end_date="now").isoformat(),
        })
    return users


def generate_transactions(count: int = 2000) -> list[dict]:
    Faker.seed(42)
    f = Faker("en_IN")
    txn_types = ["NEFT", "IMPS", "UPI", "RTGS", "CDM", "ATM"]
    descriptions = [
        "Online Purchase - Amazon", "UPI Transfer", "Salary Credit", "EMI Deduction",
        "Netflix Subscription", "Electricity Bill", "Mobile Recharge", "Insurance Premium",
        "Mutual Fund SIP", "Grocery - BigBasket", "Fuel - HP Petrol", "Hospital Payment",
        "Hotel Booking - OYO", "Flight Booking - IndiGo", "ATM Withdrawal",
    ]
    transactions = []
    for i in range(count):
        txn_type = random.choice(["CREDIT", "DEBIT"])
        amount = round(random.uniform(100, 50000), 2)
        transactions.append({
            "id": i + 1,
            "account_number": f"HDFC{random.randint(10000000, 99999999)}",
            "txn_type": txn_type,
            "txn_mode": random.choice(txn_types),
            "amount": amount,
            "description": random.choice(descriptions),
            "reference_id": f"REF{random.randint(100000000, 999999999)}",
            "balance_after": round(random.uniform(500, 1000000), 2),
            "timestamp": f.date_time_between(start_date="-1y", end_date="now").isoformat(),
            "status": "SUCCESS",
        })
    return transactions


# Cache generated data at module import (avoid regenerating on every request)
_USERS_CACHE: list[dict] = []
_TRANSACTIONS_CACHE: list[dict] = []


def get_users() -> list[dict]:
    global _USERS_CACHE
    if not _USERS_CACHE:
        _USERS_CACHE = generate_users(500)
    return _USERS_CACHE


def get_transactions() -> list[dict]:
    global _TRANSACTIONS_CACHE
    if not _TRANSACTIONS_CACHE:
        _TRANSACTIONS_CACHE = generate_transactions(2000)
    return _TRANSACTIONS_CACHE
