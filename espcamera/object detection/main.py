# # Step 1: Install and download necessary files
# !pip install -q opencv-python opencv-python-headless numpy matplotlib
# !wget -q https://pjreddie.com/media/files/yolov3.weights -O yolov3.weights
# !wget -q https://raw.githubusercontent.com/pjreddie/darknet/master/cfg/yolov3.cfg -O yolov3.cfg
# !wget -q https://raw.githubusercontent.com/pjreddie/darknet/master/data/coco.names -O coco.names
# Step 2: Import libraries and load YOLOv3
from ultralytics import YOLO
import cv2
import matplotlib.pyplot as plt

# Load a pre-trained YOLOv8 model (YOLOv8n is the nano model, which is lightweight)
model = YOLO('yolov8n.pt')  # You can also try 'yolov8s.pt' or 'yolov8l.pt' for larger models

def detect_objects_yolov8(image_path):
    # Load the image
    img = cv2.imread(image_path)
    
    # Run the YOLOv8 model on the image
    results = model(img)

    # Visualize and display the results
    annotated_image = results[0].plot()  # YOLOv8 provides a method to plot annotations on the image
    
    # Display the image
    plt.figure(figsize=(10, 10))
    plt.axis("off")
    plt.imshow(cv2.cvtColor(annotated_image, cv2.COLOR_BGR2RGB))
    plt.show()

# Replace 'path/to/your/image.jpg' with the actual path to your image file
detect_objects_yolov8("path/to/your/image.jpg")

def detect_objects_webcam():
    # Open the webcam
    cap = cv2.VideoCapture(0)  # Use 0 for the default camera, or 1, 2, etc. for external cameras
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # Run the YOLOv8 model on the frame
        results = model(frame)
        
        # Annotate the frame
        annotated_frame = results[0].plot()
        
        # Display the frame
        cv2.imshow("YOLOv8 Real-Time Detection", annotated_frame)
        
        # Exit on pressing 'q'
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    # Release the camera and close the window
    cap.release()
    cv2.destroyAllWindows()

# Start real-time detection
detect_objects_webcam()
