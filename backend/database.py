"""
MIRAGE Backend — Database Models (SQLite + SQLAlchemy)
Sessions and Events tables as defined in PRD Section 5.4
"""
import uuid
from datetime import datetime
from sqlalchemy import (
    create_engine, Column, Text, Integer, DateTime, JSON, String, ForeignKey
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = "sqlite:///./mirage.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Text, primary_key=True, default=lambda: str(uuid.uuid4()))
    ip_header = Column(Text, nullable=True)
    webrtc_ip = Column(Text, nullable=True)
    user_agent = Column(Text, nullable=True)
    canvas_hash = Column(Text, nullable=True)
    device_profile = Column(JSON, nullable=True)
    threat_score = Column(Integer, default=0)
    tier = Column(Text, default="Script Kiddie")
    started_at = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    dossier_path = Column(Text, nullable=True)

    events = relationship("Event", back_populates="session", cascade="all, delete-orphan")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Text, ForeignKey("sessions.id"), nullable=False)
    event_type = Column(Text, nullable=False)   # PATH_PROBE / LOGIN_ATTEMPT / HONEYTOKEN_ACCESS / OTP_TRAP / TELEMETRY
    severity = Column(Text, nullable=False)      # LOW / MEDIUM / HIGH / CRITICAL
    path = Column(Text, nullable=True)
    payload = Column(JSON, nullable=True)
    score_delta = Column(Integer, default=0)
    mitre_technique = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="events")


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
