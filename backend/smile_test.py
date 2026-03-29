
import cv2
import cvzone
from cvzone.FaceMeshModule import FaceMeshDetector
import time
import numpy as np

# Initialize the detector
detector = FaceMeshDetector(maxFaces=1)

# --- THE UNBREAKABLE ANCHORS ---
FOREHEAD = 10
CHIN = 152
EYE_L = 33
EYE_R = 263

# --- MULTI-NODE ENSEMBLES ---
LIP_LEFT_NODES = [61, 39, 181]   
LIP_RIGHT_NODES = [291, 269, 405]

def calculate_distance(p1, p2):
    return np.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

def dist_to_line(p0, p1, p2):
    """Calculates perpendicular distance from point p0 to the line defined by p1 and p2."""
    p0, p1, p2 = np.array(p0[:2]), np.array(p1[:2]), np.array(p2[:2])
    return np.abs(np.cross(p2-p1, p1-p0)) / (np.linalg.norm(p2-p1) + 1e-6)

def extract_ensemble_metrics(face):
    """Processes 6 lip nodes against facial axes to find pure asymmetry."""
    mid_pt1, mid_pt2 = face[FOREHEAD], face[CHIN]
    eye_pt1, eye_pt2 = face[EYE_L], face[EYE_R]

    # Horizontal and Vertical distances to the axes
    left_h_dists = [dist_to_line(face[n], mid_pt1, mid_pt2) for n in LIP_LEFT_NODES]
    right_h_dists = [dist_to_line(face[n], mid_pt1, mid_pt2) for n in LIP_RIGHT_NODES]
    left_v_dists = [dist_to_line(face[n], eye_pt1, eye_pt2) for n in LIP_LEFT_NODES]
    right_v_dists = [dist_to_line(face[n], eye_pt1, eye_pt2) for n in LIP_RIGHT_NODES]

    avg_left_h, avg_right_h = np.mean(left_h_dists), np.mean(right_h_dists)
    avg_left_v, avg_right_v = np.mean(left_v_dists), np.mean(right_v_dists)

    h_asym = abs(avg_left_h - avg_right_h) / (avg_left_h + avg_right_h + 1e-6)
    v_asym = abs(avg_left_v - avg_right_v) / (avg_left_v + avg_right_v + 1e-6)
    
    mouth_width = calculate_distance(face[61], face[291])
    face_width = calculate_distance(face[234], face[454])

    return {
        "h_asym": h_asym,
        "v_asym": v_asym,
        "intensity": mouth_width / face_width
    }

def calculate_scores(neutral, smile_frames):
    peak_smile = max(smile_frames, key=lambda x: x['intensity'])
    
    # Calculate pure dynamic changes (Smile minus Neutral)
    dynamic_h_shift = max(0, peak_smile['h_asym'] - neutral['h_asym'])
    dynamic_v_shift = max(0, peak_smile['v_asym'] - neutral['v_asym'])
    expansion = max(0, peak_smile['intensity'] - neutral['intensity'])
    
    # --- PRO-LEVEL SMOOTH SCALING (Interpolation) ---
    # np.interp maps a value from one range to another. 
    # Example: If h_shift is 0.015 (1.5%), risk is 0. If it hits 0.08 (8%), risk is 100.
    
    h_risk_score = np.interp(dynamic_h_shift, [0.015, 0.08], [0, 100])
    v_risk_score = np.interp(dynamic_v_shift, [0.015, 0.08], [0, 100])
    
    # For intensity, lower expansion means higher risk (Parkinson's/Hypomimia)
    # Healthy expansion is ~0.10. If it's below 0.03, risk is 100.
    hypomimia_risk_score = np.interp(expansion, [0.03, 0.10], [100, 0])

    # Blend the metrics into specific disease risks
    stroke_risk = (h_risk_score * 0.4) + (v_risk_score * 0.6)
    bells_risk = (v_risk_score * 0.7) + (h_risk_score * 0.3)
    parkinsons_risk = hypomimia_risk_score
    
    # ALS is a mix of overall weakness (hypomimia) and mild asymmetry
    als_risk = (hypomimia_risk_score * 0.6) + (stroke_risk * 0.4)

    return {
        "Stroke": round(stroke_risk, 2),
        "Parkinsons": round(parkinsons_risk, 2),
        "BellsPalsy": round(bells_risk, 2),
        "ALS": round(als_risk, 2),
        "Metrics": {
            "Dynamic_H_Shift": round(dynamic_h_shift, 4),
            "Dynamic_V_Droop": round(dynamic_v_shift, 4),
            "Expansion": round(expansion, 4)
        }
    }

def display_terminal_results(results):
    print("\n" + "="*55)
    print("      NEURODECT HIGH-RES ANALYSIS REPORT")
    print("="*55)
    print(f"Stroke Risk Index:          {results['Stroke']:>6.2f} / 100")
    print(f"Parkinson's Risk Index:     {results['Parkinsons']:>6.2f} / 100")
    print(f"Bell's Palsy Risk Index:    {results['BellsPalsy']:>6.2f} / 100")
    print(f"ALS Risk Index:             {results['ALS']:>6.2f} / 100")
    print("-" * 55)
    print("RAW BIOMETRIC SHIFTS (Delta from Neutral):")
    print(f"- Horizontal Muscle Pull Diff: {results['Metrics']['Dynamic_H_Shift']*100:.2f}%")
    print(f"- Vertical Muscle Droop Diff:  {results['Metrics']['Dynamic_V_Droop']*100:.2f}%")
    print(f"- Mouth Expansion Ratio:       {results['Metrics']['Expansion']*100:.2f}%")
    print("="*55 + "\n")

def main():
    cap = cv2.VideoCapture(0)
    
    # FORCE HIGH RESOLUTION (720p)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    state = "INSTRUCTIONS" 
    neutral_data = None
    smile_data = []
    timer_start = 0
    instruction_text = "Look straight, neutral face. Press 'SPACE'."
    
    print("--- NEURODECT EXTREME PRECISION TEST BOOTING ---")
    
    while True:
        success, img = cap.read()
        if not success: break
            
        img = cv2.flip(img, 1)
        
        # draw=True ensures the green mesh is rendered for a great UI
        img, faces = detector.findFaceMesh(img, draw=True)
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'): break
        
        if faces:
            face = faces[0]
            
            # Draw UI background and text for visibility
            cv2.rectangle(img, (10, 20), (700, 70), (0, 0, 0), cv2.FILLED)
            cv2.putText(img, instruction_text, (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
            
            if state == "INSTRUCTIONS":
                if key == ord(' '):
                    neutral_data = extract_ensemble_metrics(face)
                    state = "SMILE_PROMPT"
                    instruction_text = "SMILE! Press 'SPACE' to start 3s capture."
            
            elif state == "SMILE_PROMPT":
                if key == ord(' '):
                    state = "SMILE_CAPTURE"
                    timer_start = time.time()
                    smile_data = []
            
            elif state == "SMILE_CAPTURE":
                elapsed = time.time() - timer_start
                instruction_text = f"HOLDING SMILE... {3 - int(elapsed)}s"
                
                smile_data.append(extract_ensemble_metrics(face))
                
                if elapsed >= 3:
                    state = "RESULTS"
                    results = calculate_scores(neutral_data, smile_data)
                    display_terminal_results(results)
                    instruction_text = "Analysis complete. 'R' to restart, 'Q' to quit."
            
            elif state == "RESULTS":
                if key == ord('r'):
                    state = "INSTRUCTIONS"
                    instruction_text = "Look straight, neutral face. Press 'SPACE'."

        cv2.imshow("NeuroDect High-Res Analysis", img)

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()

