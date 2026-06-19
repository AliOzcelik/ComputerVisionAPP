import cv2

def check_cuda_available():
    try:
        device_count = cv2.cuda.getCudaEnabledDeviceCount()
        if device_count > 0:
            # Try to get device info
            cv2.cuda.setDevice(0)
            return True, device_count, f"CUDA available with {device_count} device(s)"
        else:
            return False, 0, "No CUDA devices found"
    except cv2.error as e:
        return False, 0, f"CUDA not supported: {str(e)}"
    except AttributeError:
        return False, 0, "OpenCV not built with CUDA support"


def get_cuda_device_info():
    devices = []
    try:
        count = cv2.cuda.getCudaEnabledDeviceCount()
        for i in range(count):
            cv2.cuda.setDevice(i)
            devices.append({
                'id': i,
                'name': f"CUDA Device {i}"
            })
    except (cv2.error, AttributeError):
        pass
    return devices