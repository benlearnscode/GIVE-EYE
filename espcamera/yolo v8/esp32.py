import cv2
import numpy as np
from ultralytics import YOLO
import requests

'''
INFO SECTION
- if you want to monitor raw parameters of ESP32CAM, open the browser and go to http://192.168.x.x/status
- command can be sent through an HTTP get composed in the following way http://192.168.x.x/control?var=VARIABLE_NAME&val=VALUE (check varname and value in status)
'''

# ESP32 URL
URL = "http://192.168.29.93"
AWB = True
# Load the YOLOv8 model
model = YOLO("yolov8m.pt")  # Use "yolov8n.pt" for the small model
# Face recognition and opencv setup
cap = cv2.VideoCapture(URL + ":81/stream")
# face_classifier = cv2.CascadeClassifier('haarcascade_frontalface_alt.xml') # insert the full path to haarcascade file if you encounter any problem

# Video output file path and codec
output_file = 'output_video.avi'
frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))  # Capture width
frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))  # Capture height
fourcc = cv2.VideoWriter_fourcc(*'XVID')  # Codec to use for video writing
out = cv2.VideoWriter(output_file, fourcc, 20.0, (frame_width, frame_height))  # Video writer setup

def set_resolution(url: str, index: int=1, verbose: bool=False):
    try:
        if verbose:
            resolutions = "10: UXGA(1600x1200)\n9: SXGA(1280x1024)\n8: XGA(1024x768)\n7: SVGA(800x600)\n6: VGA(640x480)\n5: CIF(400x296)\n4: QVGA(320x240)\n3: HQVGA(240x176)\n0: QQVGA(160x120)"
            print("available resolutions\n{}".format(resolutions))

        if index in [10, 9, 8, 7, 6, 5, 4, 3, 0]:
            requests.get(url + "/control?var=framesize&val={}".format(index))
        else:
            print("Wrong index")
    except:
        print("SET_RESOLUTION: something went wrong")

def set_quality(url: str, value: int=1, verbose: bool=False):
    try:
        if value >= 10 and value <=63:
            requests.get(url + "/control?var=quality&val={}".format(value))
    except:
        print("SET_QUALITY: something went wrong")

def set_awb(url: str, awb: int=1):
    try:
        awb = not awb
        requests.get(url + "/control?var=awb&val={}".format(1 if awb else 0))
    except:
        print("SET_QUALITY: something went wrong")
    return awb

if __name__ == '__main__':
    set_resolution(URL, index=9)
    set_quality(URL, value=4)

    while True:
        if cap.isOpened():
            ret, frame = cap.read()

            if ret:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                gray = cv2.equalizeHist(gray)

                # faces = face_classifier.detectMultiScale(gray)
                # for (x, y, w, h) in faces:
                #     center = (x + w//2, y + h//2)
                #     frame = cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 255, 0), 4)
                # Run YOLOv8 model on the frame
                results = model(frame)

                # Annotate frame with detection results
                annotated_frame = results[0].plot()

                # Save the annotated frame to the output video
                out.write(annotated_frame)

                # Display the annotated frame
                cv2.imshow("YOLOv8 Object Detection", annotated_frame)

                # cv2.imshow("frame", frame)

                key = cv2.waitKey(1)

                if key == ord('r'):
                    idx = int(input("Select resolution index: "))
                    set_resolution(URL, index=idx, verbose=True)

                elif key == ord('q'):
                    val = int(input("Set quality (10 - 63): "))
                    set_quality(URL, value=val)

                elif key == ord('a'):
                    AWB = set_awb(URL, AWB)

                elif key == 27:
                    break

    # Release the video writer and capture object
    out.release()
    cv2.destroyAllWindows()
    cap.release()
