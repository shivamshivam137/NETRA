# NETRA
### Networked Engine for Traffic Recognition and Analytics

> **City-Wide AI Engine for Multi-Camera ANPR, Vehicle Trajectory Tracking and Urban Traffic Analytics**

---

## 📌 Overview

Modern cities deploy large networks of CCTV and Automatic Number Plate Recognition (ANPR) cameras for traffic management, law enforcement, and public safety. However, many existing systems operate individual camera feeds in isolation and primarily perform vehicle or license plate detection without effectively connecting observations across different cameras.

This creates a major limitation: authorities cannot efficiently reconstruct the movement of a specific vehicle across a city or extract meaningful city-wide traffic patterns from geographically distributed camera networks.

**NETRA (Networked Engine for Traffic Recognition and Analytics)** is a centralized AI-powered platform designed to integrate data from multiple ANPR cameras and transform individual vehicle detections into meaningful spatial-temporal intelligence.

The system combines:

- Vehicle and license plate detection
- License plate OCR
- Multi-camera vehicle association
- Plate-based vehicle matching
- Trajectory reconstruction
- GIS-based visualization
- City-wide traffic analytics
- Real-time alert generation

---

# 🎯 Problem Statement

Existing ANPR systems often process camera feeds independently.

As a result:

- A vehicle detected by Camera A may not be connected to its detection by Camera B.
- Complete vehicle travel paths cannot easily be reconstructed.
- Traffic movement between different locations is difficult to analyze.
- Suspicious vehicle movements may not be detected automatically.
- Camera-level information is not effectively converted into city-wide traffic intelligence.

NETRA addresses this problem by creating a unified pipeline that connects observations from multiple cameras using vehicle detection, license plate recognition, temporal information, spatial relationships, and camera metadata.

---

# 🚀 Objectives

NETRA aims to achieve three major objectives:

### 1. High-Accuracy ANPR and OCR

Detect vehicles and license plates from multiple camera feeds and extract license plate characters using an OCR-based recognition pipeline.

The system is designed to handle challenging real-world conditions including:

- Different lighting conditions
- Poor weather
- Angled license plates
- Motion blur
- Low-resolution frames
- Dirty or damaged plates
- Multi-lane traffic
- Different camera viewpoints

The target is **greater than 90% license plate recognition accuracy** under supported conditions.

---

### 2. Single-Plate Trajectory Tracking

Reconstruct the movement history of a specific license plate across multiple cameras.

For a queried vehicle, the system should provide:

```text
Vehicle / Plate
      ↓
Camera 01
      ↓
Camera 04
      ↓
Camera 07
      ↓
Camera 12
      ↓
Camera 18
