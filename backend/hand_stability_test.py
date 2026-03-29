import cv2
import mediapipe as mp
import numpy as np
import time

# --- 1. INITIALIZE MEDIAPIPE & OPENCV ---
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.7, min_tracking_confidence=0.7)

cap = cv2.VideoCapture(0)

# --- 2. STATE VARIABLES ---
is_testing = False
start_time = 0
motion_data = [] # Will store (time, avg_x, avg_y)
results = None
status_text = "Waiting for hand..."

# Fingertip landmarks in MediaPipe
FINGERTIPS = [4, 8, 12, 16, 20] 

def analyze_motion(data):
    if len(data) < 15: # Reduced requirement for 5 seconds
        return {"error": "Not enough data. Keep hand in frame."}

    times = np.array([p[0] for p in data])
    x_vals = np.array([p[1] for p in data]) * 640
    y_vals = np.array([p[2] for p in data]) * 480
    total_time = times[-1] - times[0]

    if total_time < 0.5:
        return {"error": "Scan too short."}

    # --- 1. STROKE DETECTION (Pronator Drift) ---
    # Average Y height at the end vs the beginning
    y_drift = np.mean(y_vals[-10:]) - np.mean(y_vals[:10])
    # If hand drops by ~60 pixels in 5 seconds, high stroke risk
    stroke_score = min(max(int((y_drift / 60.0) * 100), 0), 98) 

    # --- 2. PARKINSON'S DETECTION (4-6 Hz Tremor) ---
    p_x = np.polyfit(times, x_vals, 1)
    p_y = np.polyfit(times, y_vals, 1)
    x_detrended = x_vals - (p_x[0]*times + p_x[1])
    y_detrended = y_vals - (p_y[0]*times + p_y[1])
    
    shake_amplitude = np.std(x_detrended) + np.std(y_detrended)
    base_shake_score = min(int((shake_amplitude / 10.0) * 100), 98)

    dx = np.diff(x_vals)
    dy = np.diff(y_vals)
    dx_clean = dx[np.abs(dx) > 1.0]
    dy_clean = dy[np.abs(dy) > 1.0]
    
    x_turns = np.sum(np.diff(np.sign(dx_clean)) != 0) if len(dx_clean) > 1 else 0
    y_turns = np.sum(np.diff(np.sign(dy_clean)) != 0) if len(dy_clean) > 1 else 0
    
    freq_x = (x_turns / 2.0) / total_time
    freq_y = (y_turns / 2.0) / total_time
    dominant_freq = max(freq_x, freq_y)

    # Only flag Parkinson's if it's within the resting tremor band (3-6.5 Hz)
    parkinsons_score = 0
    if base_shake_score > 15 and 3.0 <= dominant_freq <= 6.5:
        parkinsons_score = base_shake_score

    # RETURN ONLY THE 2 RELEVANT METRICS
    return {
        "freq": round(dominant_freq, 1),
        "Parkinsons (Tremor)": parkinsons_score,
        "Stroke (Drift)": stroke_score
    }

# --- 3. MAIN CAMERA LOOP ---
while cap.isOpened():
    success, frame = cap.read()
    if not success:
        break

    frame = cv2.flip(frame, 1)
    h, w, c = frame.shape
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    process_results = hands.process(rgb_frame)

    all_fingers_visible = False
    
    if process_results.multi_hand_landmarks:
        for hand_landmarks in process_results.multi_hand_landmarks:
            mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
            
            # Check if all 5 fingertips are within screen bounds
            visible_count = 0
            sum_x, sum_y = 0, 0
            
            for tip_idx in FINGERTIPS:
                lm = hand_landmarks.landmark[tip_idx]
                # Check if x and y are strictly inside the 0.0 to 1.0 screen boundaries
                if 0.01 < lm.x < 0.99 and 0.01 < lm.y < 0.99:
                    visible_count += 1
                    sum_x += lm.x
                    sum_y += lm.y
                    # Draw blue circles on tips
                    cx, cy = int(lm.x * w), int(lm.y * h)
                    cv2.circle(frame, (cx, cy), 10, (255, 0, 0), cv2.FILLED)
            
            if visible_count == 5:
                all_fingers_visible = True
                avg_x = sum_x / 5.0
                avg_y = sum_y / 5.0

                if is_testing:
                    current_time = time.time() - start_time
                    # Store the average center of the fingertips instead of just index finger
                    motion_data.append((current_time, avg_x, avg_y))

    # --- UI & STATE LOGIC ---
    if not is_testing:
        if all_fingers_visible:
            status_text = "READY: PRESS 'S' TO START 5-SEC SCAN"
            status_color = (0, 255, 0) # Green
        else:
            status_text = "PLEASE PLACE FULL PALM IN FRONT OF SCREEN"
            status_color = (0, 0, 255) # Red
            results = None # Clear results if hand drops
    else:
        elapsed_time = time.time() - start_time
        time_left = 5.0 - elapsed_time # Changed to 5 seconds
        
        if time_left > 0:
            if all_fingers_visible:
                status_text = f"RECORDING... Hold steady. ({time_left:.1f}s)"
                status_color = (0, 255, 255) # Yellow
                cv2.rectangle(frame, (0, 0), (w, h), (0, 255, 255), 10)
            else:
                # User dropped their hand during the test! Abort.
                is_testing = False
                status_text = "TEST FAILED: Hand left screen. Try again."
                status_color = (0, 0, 255)
        else:
            is_testing = False
            results = analyze_motion(motion_data)
            status_text = "DONE. Press 'S' to rescan."
            status_color = (255, 255, 255)

    # --- DRAWING OVERLAY ---
    cv2.rectangle(frame, (10, 10), (650, 50), (0, 0, 0), cv2.FILLED)
    cv2.putText(frame, status_text, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)

    if results and "error" not in results:
        cv2.rectangle(frame, (10, 70), (450, 220), (30, 30, 30), cv2.FILLED)
        cv2.putText(frame, "DIAGNOSTIC METRICS", (20, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 200, 0), 2)
        cv2.putText(frame, f"Tremor Frequency: {results['freq']} Hz", (20, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)

        y_offset = 170
        for disease in ["Parkinsons (Tremor)", "Stroke (Drift)"]:
            score = results[disease]
            color = (0, 255, 0) if score < 25 else (0, 255, 255) if score < 60 else (0, 0, 255)
            
            text = f"{disease}: {score}%"
            cv2.putText(frame, text, (20, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
            
            bar_width = int((score / 100.0) * 200)
            cv2.rectangle(frame, (250, y_offset - 15), (450, y_offset), (100, 100, 100), 1) 
            cv2.rectangle(frame, (250, y_offset - 15), (250 + bar_width, y_offset), color, cv2.FILLED) 
            y_offset += 40
            
    elif results and "error" in results:
        cv2.putText(frame, results["error"], (20, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

    cv2.imshow('NeuroDect - Hand Stability', frame)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break
    elif key == ord('s') and not is_testing and all_fingers_visible:
        is_testing = True
        start_time = time.time()
        motion_data = []
        results = None

cap.release()
cv2.destroyAllWindows()