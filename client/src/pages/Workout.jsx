import { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import { toast } from "react-hot-toast";
import useWorkoutStore from "../store/workoutStore";

// Import MediaPipe
const mpPose = window.pose;

const exercises = [
    { id: "squat", name: "Squats", target: 10 },
    { id: "push-up", name: "Push Ups", target: 10 },
    { id: "sit-up", name: "Sit Ups", target: 15 },
];

// Exercise detection configurations based on the Python model
const EXERCISE_CONFIG = {
    squat: {
        confidence: 0.3,
        cooldown: 1000,
        downAngle: 70, // From the Python model
        upAngle: 160, // From the Python model
    },
    "push-up": {
        downAngle: 85, // Adjusted for better upper body detection
        upAngle: 150, // Adjusted for better upper body detection
        confidence: 0.5, // Increased confidence threshold
        cooldown: 1200, // Slightly increased cooldown for better detection
    },
    "sit-up": {
        downAngle: 55, // From the Python model
        upAngle: 105, // From the Python model
        confidence: 0.3,
        cooldown: 1000,
    },
};

// Define the connections between keypoints for drawing (using MediaPipe indices)
const POSE_CONNECTIONS = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 7], // Face
    [0, 4],
    [4, 5],
    [5, 6],
    [6, 8], // Face
    [9, 10], // Shoulders
    [9, 11],
    [11, 13],
    [13, 15], // Left arm
    [10, 12],
    [12, 14],
    [14, 16], // Right arm
    [11, 23],
    [23, 25],
    [25, 27], // Left leg
    [12, 24],
    [24, 26],
    [26, 28], // Right leg
    [23, 24], // Hips
];

export default function Workout() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const requestRef = useRef();
    const [detector, setDetector] = useState(null);
    const [cameraEnabled, setCameraEnabled] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const {
        currentWorkout,
        setCurrentWorkout,
        clearCurrentWorkout,
        updateWorkoutProgress,
        addWorkout,
    } = useWorkoutStore();

    useEffect(() => {
        let poseDetector = null;
        let camera = null;

        const initializeDetector = async () => {
            try {
                setIsModelLoading(true);

                // Initialize MediaPipe Pose
                poseDetector = new window.Pose({
                    locateFile: (file) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                    },
                });

                // Configure pose detection
                await poseDetector.setOptions({
                    modelComplexity: 1,
                    smoothLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                });

                // Set up pose detection callback
                poseDetector.onResults((results) => {
                    if (results.poseLandmarks) {
                        drawPose(results.poseLandmarks);
                        if (currentWorkout) {
                            processPose(results.poseLandmarks);
                        }
                    }
                });

                setDetector(poseDetector);

                // Wait for the video element to be ready
                while (!webcamRef.current?.video?.readyState) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }

                // Initialize camera after pose detector is ready
                camera = new window.Camera(webcamRef.current.video, {
                    onFrame: async () => {
                        try {
                            if (webcamRef.current?.video) {
                                await poseDetector.send({
                                    image: webcamRef.current.video,
                                });
                            }
                        } catch (error) {
                            console.error(
                                "Error in camera frame processing:",
                                error
                            );
                        }
                    },
                    width: 1280,
                    height: 720,
                });

                await camera.start();
                setIsModelLoading(false);
                toast.success("AI model loaded successfully");
            } catch (error) {
                console.error("Error initializing pose detector:", error);
                setIsModelLoading(false);
                toast.error("Failed to load AI model. Please try again.");
            }
        };

        if (cameraEnabled) {
            initializeDetector();
        }

        return () => {
            const cleanup = async () => {
                try {
                    if (camera) {
                        await camera.stop();
                    }
                    if (poseDetector) {
                        await poseDetector.close();
                    }
                    if (webcamRef.current?.video?.srcObject) {
                        const tracks =
                            webcamRef.current.video.srcObject.getTracks();
                        tracks.forEach((track) => track.stop());
                    }
                    clearCanvas();
                } catch (error) {
                    console.error("Error during cleanup:", error);
                }
            };
            cleanup();
        };
    }, [cameraEnabled, currentWorkout]);

    const drawPose = (poseLandmarks) => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx || !webcamRef.current?.video) return;

        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;

        // Clear the canvas and save the context state
        ctx.clearRect(0, 0, videoWidth, videoHeight);
        ctx.save();

        // Mirror the context to match the video feed
        ctx.scale(-1, 1);
        ctx.translate(-videoWidth, 0);

        // Draw connections
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#00ff00";

        POSE_CONNECTIONS.forEach(([start, end]) => {
            const startPoint = poseLandmarks[start];
            const endPoint = poseLandmarks[end];

            if (
                startPoint &&
                endPoint &&
                startPoint.visibility > 0.5 &&
                endPoint.visibility > 0.5
            ) {
                ctx.beginPath();
                ctx.moveTo(
                    startPoint.x * videoWidth,
                    startPoint.y * videoHeight
                );
                ctx.lineTo(endPoint.x * videoWidth, endPoint.y * videoHeight);
                ctx.stroke();
            }
        });

        // Draw keypoints
        poseLandmarks.forEach((landmark) => {
            if (landmark.visibility > 0.5) {
                const x = landmark.x * videoWidth;
                const y = landmark.y * videoHeight;

                ctx.beginPath();
                ctx.arc(x, y, 8, 0, 2 * Math.PI);
                ctx.fillStyle = "#000000";
                ctx.fill();

                ctx.beginPath();
                ctx.arc(x, y, 6, 0, 2 * Math.PI);
                ctx.fillStyle = "#00ff00";
                ctx.fill();
            }
        });

        ctx.restore();
    };

    const processPose = (pose) => {
        if (!currentWorkout) return;

        const now = Date.now();

        if (
            !currentWorkout.lastRepTime ||
            now - currentWorkout.lastRepTime >
                EXERCISE_CONFIG[currentWorkout.id].cooldown
        ) {
            switch (currentWorkout.id) {
                case "squat":
                    processSquat(pose);
                    break;
                case "push-up":
                    processPushup(pose);
                    break;
                case "sit-up":
                    processSitup(pose);
                    break;
            }
        }
    };

    const processSquat = (pose) => {
        const leftHip = pose.find((kp) => kp.name === "left_hip");
        const leftKnee = pose.find((kp) => kp.name === "left_knee");
        const leftAnkle = pose.find((kp) => kp.name === "left_ankle");
        const rightHip = pose.find((kp) => kp.name === "right_hip");
        const rightKnee = pose.find((kp) => kp.name === "right_knee");
        const rightAnkle = pose.find((kp) => kp.name === "right_ankle");

        if (
            !leftHip ||
            !leftKnee ||
            !leftAnkle ||
            !rightHip ||
            !rightKnee ||
            !rightAnkle
        )
            return;

        // Calculate leg angles
        const leftLegAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
        const rightLegAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
        const avgLegAngle = (leftLegAngle + rightLegAngle) / 2;

        console.log("Squat angles:", {
            leftLegAngle,
            rightLegAngle,
            avgLegAngle,
            isDown: currentWorkout.isDown,
        });

        const now = Date.now();

        if (
            avgLegAngle < EXERCISE_CONFIG[currentWorkout.id].downAngle &&
            !currentWorkout.isDown
        ) {
            const newCount = currentWorkout.count + 1;
            console.log("Counting squat:", newCount);
            updateWorkoutProgress({
                count: newCount,
                isDown: true,
                lastRepTime: now,
            });

            if (newCount % 5 === 0 || newCount === currentWorkout.target) {
                toast.success(`Completed ${newCount} squats!`);
            }
        } else if (
            avgLegAngle > EXERCISE_CONFIG[currentWorkout.id].upAngle &&
            currentWorkout.isDown
        ) {
            updateWorkoutProgress({
                isDown: false,
                lastRepTime: now,
            });
        }
    };

    const processPushup = (pose) => {
        // Only track upper body landmarks for push-ups
        const leftShoulder = pose[11];
        const rightShoulder = pose[12];
        const leftElbow = pose[13];
        const rightElbow = pose[14];
        const leftWrist = pose[15];
        const rightWrist = pose[16];

        if (
            !leftShoulder ||
            !rightShoulder ||
            !leftElbow ||
            !rightElbow ||
            !leftWrist ||
            !rightWrist ||
            !currentWorkout
        )
            return;

        // Check visibility of landmarks
        if (
            leftShoulder.visibility < 0.5 ||
            rightShoulder.visibility < 0.5 ||
            leftElbow.visibility < 0.5 ||
            rightElbow.visibility < 0.5 ||
            leftWrist.visibility < 0.5 ||
            rightWrist.visibility < 0.5
        )
            return;

        // Calculate arm angles
        const leftArmAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
        const rightArmAngle = calculateAngle(
            rightShoulder,
            rightElbow,
            rightWrist
        );
        const avgArmAngle = (leftArmAngle + rightArmAngle) / 2;

        const now = Date.now();

        // Only process if enough time has passed since last rep
        if (
            !currentWorkout.lastRepTime ||
            now - currentWorkout.lastRepTime >
                EXERCISE_CONFIG[currentWorkout.id].cooldown
        ) {
            if (
                avgArmAngle < EXERCISE_CONFIG[currentWorkout.id].downAngle &&
                !currentWorkout.isDown
            ) {
                const newCount = currentWorkout.count + 1;
                updateWorkoutProgress({
                    count: newCount,
                    isDown: true,
                    lastRepTime: now,
                });

                if (newCount % 5 === 0 || newCount === currentWorkout.target) {
                    toast.success(`Completed ${newCount} push-ups!`);
                }
            } else if (
                avgArmAngle > EXERCISE_CONFIG[currentWorkout.id].upAngle &&
                currentWorkout.isDown
            ) {
                updateWorkoutProgress({
                    isDown: false,
                    lastRepTime: now,
                });
            }
        }
    };

    const processSitup = (pose) => {
        const leftShoulder = pose.find((kp) => kp.name === "left_shoulder");
        const leftHip = pose.find((kp) => kp.name === "left_hip");
        const leftKnee = pose.find((kp) => kp.name === "left_knee");

        if (!leftShoulder || !leftHip || !leftKnee) return;

        // Calculate angle between shoulder, hip, and knee
        const angle = calculateAngle(leftShoulder, leftHip, leftKnee);

        console.log("Sit-up angle:", { angle, isDown: currentWorkout.isDown });

        const now = Date.now();

        if (
            angle < EXERCISE_CONFIG[currentWorkout.id].downAngle &&
            !currentWorkout.isDown
        ) {
            const newCount = currentWorkout.count + 1;
            console.log("Counting sit-up:", newCount);
            updateWorkoutProgress({
                count: newCount,
                isDown: true,
                lastRepTime: now,
            });

            if (newCount % 5 === 0 || newCount === currentWorkout.target) {
                toast.success(`Completed ${newCount} sit-ups!`);
            }
        } else if (
            angle > EXERCISE_CONFIG[currentWorkout.id].upAngle &&
            currentWorkout.isDown
        ) {
            updateWorkoutProgress({
                isDown: false,
                lastRepTime: now,
            });
        }
    };

    // Add angle calculation function from the model
    const calculateAngle = (a, b, c) => {
        // Convert to radians
        const radians =
            Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);

        // Convert to degrees
        let angle = Math.abs((radians * 180.0) / Math.PI);

        // Ensure angle is <= 180
        if (angle > 180.0) {
            angle = 360 - angle;
        }

        return angle;
    };

    // Handle exercise selection
    const handleExerciseSelect = (exercise) => {
        setSelectedExercise(exercise);
        toast.success(`Selected ${exercise.name}. Click Start to begin!`);
    };

    // Start exercise tracking
    const startExercise = () => {
        if (!selectedExercise) {
            toast.error("Please select an exercise first!");
            return;
        }

        // Clear the canvas
        clearCanvas();

        setCurrentWorkout({
            ...selectedExercise,
            count: 0,
            isDown: false,
            isUp: false,
            lastRepTime: 0,
            startTime: new Date(),
        });

        // Enable camera which will trigger pose detection
        setCameraEnabled(true);
        toast.success(`Starting ${selectedExercise.name}. Get ready!`);
    };

    // Stop exercise tracking
    const stopExercise = async () => {
        // Disable camera first to stop pose detection
        setCameraEnabled(false);

        // Clear the canvas
        clearCanvas();

        // Save the workout data if exists
        if (currentWorkout) {
            try {
                const now = new Date();
                // Format date as YYYY-MM-DD HH:mm:ss
                const formattedDate = now
                    .toISOString()
                    .slice(0, 19)
                    .replace("T", " ");

                await addWorkout({
                    exercise_type: currentWorkout.id,
                    reps: currentWorkout.count,
                    date: formattedDate,
                });
                toast.success("Workout saved successfully!");
            } catch (error) {
                console.error("Error saving workout:", error);
                toast.error("Failed to save workout. Please try again.");
            }
        }

        // Reset states
        clearCurrentWorkout();
        setSelectedExercise(null);
    };

    // Add this function to clear the canvas
    const clearCanvas = () => {
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx && canvasRef.current) {
            ctx.clearRect(
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
            );
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Webcam Feed */}
                <div className="card">
                    <h2 className="text-2xl font-bold mb-4">Camera Feed</h2>
                    <div className="relative aspect-[16/9] w-full bg-gray-100 rounded-lg overflow-hidden">
                        {cameraEnabled ? (
                            <>
                                <Webcam
                                    ref={webcamRef}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    mirrored={true}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{
                                        facingMode: "user",
                                        width: 1280,
                                        height: 720,
                                        aspectRatio: 16 / 9,
                                    }}
                                />
                                <canvas
                                    ref={canvasRef}
                                    className="absolute inset-0 w-full h-full"
                                />
                                {isModelLoading && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                        <div className="text-white text-center">
                                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-2"></div>
                                            <p>Loading AI Model...</p>
                                        </div>
                                    </div>
                                )}
                                {currentWorkout && !isModelLoading && (
                                    <div className="absolute top-4 right-4 bg-primary-600 text-white px-4 py-2 rounded-full">
                                        Count: {currentWorkout.count} /{" "}
                                        {currentWorkout.target}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-500">
                                    Camera will be enabled when you start the
                                    exercise
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Exercise Selection */}
                <div className="card">
                    <h2 className="text-2xl font-bold mb-4">Choose Exercise</h2>
                    <div className="space-y-4">
                        {exercises.map((exercise) => (
                            <button
                                key={exercise.id}
                                onClick={() => handleExerciseSelect(exercise)}
                                disabled={!!currentWorkout}
                                className={`w-full p-4 rounded-lg text-left transition-colors
                                    ${
                                        selectedExercise?.id === exercise.id
                                            ? "bg-primary-100 border-2 border-primary-500"
                                            : "bg-white border-2 border-gray-200 hover:border-primary-500"
                                    }
                                `}
                            >
                                <h3 className="font-semibold text-lg">
                                    {exercise.name}
                                </h3>
                                <p className="text-gray-600">
                                    Target: {exercise.target} reps
                                </p>
                            </button>
                        ))}
                    </div>

                    {selectedExercise && !currentWorkout && (
                        <button
                            onClick={startExercise}
                            className="mt-6 w-full btn-primary"
                        >
                            Start {selectedExercise.name}
                        </button>
                    )}

                    {currentWorkout && (
                        <button
                            onClick={stopExercise}
                            className="mt-6 w-full btn-secondary"
                        >
                            Stop Exercise
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
