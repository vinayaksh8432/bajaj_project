import { useState, useRef, useEffect } from "react";
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
        downAngle: 130, // Adjusted for better squat detection
        upAngle: 170, // Adjusted for standing position
    },
    "push-up": {
        downAngle: 85,
        upAngle: 150,
        confidence: 0.5,
        cooldown: 1200,
    },
    "sit-up": {
        downAngle: 55,
        upAngle: 105,
        confidence: 0.3,
        cooldown: 1000,
    },
};

// Define the connections between keypoints for drawing (using MediaPipe indices)
const POSE_CONNECTIONS = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 7],
    [0, 4],
    [4, 5],
    [5, 6],
    [6, 8],
    [9, 10],
    [9, 11],
    [11, 13],
    [13, 15],
    [10, 12],
    [12, 14],
    [14, 16],
    [11, 23],
    [23, 25],
    [25, 27],
    [12, 24],
    [24, 26],
    [26, 28],
    [23, 24],
];

export default function Workout() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const requestRef = useRef();
    const countIntervalRef = useRef(null);
    const [detector, setDetector] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const {
        currentWorkout,
        setCurrentWorkout,
        clearCurrentWorkout,
        updateWorkoutProgress,
        addWorkout,
    } = useWorkoutStore();

    const handleVideoUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const videoUrl = URL.createObjectURL(file);
            setVideoFile(videoUrl);
            if (videoRef.current) {
                videoRef.current.src = videoUrl;
            }
        }
    };

    const startExercise = async () => {
        if (!selectedExercise || !videoFile) {
            toast.error("Please select an exercise and upload a video");
            return;
        }

        setIsModelLoading(true);

        try {
            // Initialize MediaPipe Pose
            const poseDetector = new window.Pose({
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
                    // Process pose for exercise counting
                    switch (selectedExercise.id) {
                        case "squat":
                            processSquat(results.poseLandmarks);
                            break;
                        case "push-up":
                            processPushup(results.poseLandmarks);
                            break;
                        case "sit-up":
                            processSitup(results.poseLandmarks);
                            break;
                    }
                }
            });

            setDetector(poseDetector);
            setIsModelLoading(false);
            toast.success("AI model loaded successfully");

            // Start the workout with initial count
            const initialWorkout = {
                id: selectedExercise.id,
                name: selectedExercise.name,
                target: selectedExercise.target,
                count: 0,
                lastRepTime: null,
                isDown: false,
            };
            setCurrentWorkout(initialWorkout);

            // Start playing the video
            if (videoRef.current) {
                videoRef.current.play();
            }
        } catch (error) {
            console.error("Error initializing pose detector:", error);
            setIsModelLoading(false);
            toast.error("Failed to load AI model. Please try again.");
        }
    };

    useEffect(() => {
        // Check if target is reached
        if (currentWorkout && currentWorkout.count >= currentWorkout.target) {
            stopExercise();
        }
    }, [currentWorkout?.count]);

    useEffect(() => {
        let animationFrame;

        const processFrame = async () => {
            if (videoRef.current && detector && currentWorkout) {
                try {
                    await detector.send({ image: videoRef.current });
                    animationFrame = requestAnimationFrame(processFrame);
                    requestRef.current = animationFrame;
                } catch (error) {
                    console.error("Error processing video frame:", error);
                }
            }
        };

        if (currentWorkout) {
            processFrame();
        }

        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };
    }, [detector, currentWorkout]);

    // Add video end event handler
    useEffect(() => {
        const handleVideoEnd = () => {
            if (currentWorkout) {
                stopExercise();
            }
        };

        if (videoRef.current) {
            videoRef.current.addEventListener("ended", handleVideoEnd);
        }

        return () => {
            if (videoRef.current) {
                videoRef.current.removeEventListener("ended", handleVideoEnd);
            }
        };
    }, [currentWorkout]);

    const drawPose = (poseLandmarks) => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx || !videoRef.current) return;

        const videoElement = videoRef.current;
        const canvasElement = canvasRef.current;

        // Get the actual dimensions of the displayed video
        const displayWidth = videoElement.clientWidth;
        const displayHeight = videoElement.clientHeight;

        // Set canvas size to match display size
        canvasElement.width = displayWidth;
        canvasElement.height = displayHeight;

        // Calculate scaling factors
        const scaleX = displayWidth / videoElement.videoWidth;
        const scaleY = displayHeight / videoElement.videoHeight;

        // Clear the canvas
        ctx.clearRect(0, 0, displayWidth, displayHeight);

        // Draw connections
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgb(0, 255, 0)";
        ctx.fillStyle = "rgb(0, 255, 0)";

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
                    startPoint.x * displayWidth,
                    startPoint.y * displayHeight
                );
                ctx.lineTo(
                    endPoint.x * displayWidth,
                    endPoint.y * displayHeight
                );
                ctx.stroke();
            }
        });

        // Draw keypoints
        poseLandmarks.forEach((landmark) => {
            if (landmark.visibility > 0.5) {
                const x = landmark.x * displayWidth;
                const y = landmark.y * displayHeight;

                // Draw outer circle (black)
                ctx.beginPath();
                ctx.arc(x, y, 6, 0, 2 * Math.PI);
                ctx.fillStyle = "#000000";
                ctx.fill();

                // Draw inner circle (green)
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fillStyle = "#00ff00";
                ctx.fill();
            }
        });
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
        // Use direct indices for landmarks instead of find method
        const leftHip = pose[23]; // Left hip landmark
        const leftKnee = pose[25]; // Left knee landmark
        const leftAnkle = pose[27]; // Left ankle landmark
        const rightHip = pose[24]; // Right hip landmark
        const rightKnee = pose[26]; // Right knee landmark
        const rightAnkle = pose[28]; // Right ankle landmark

        if (
            !leftHip ||
            !leftKnee ||
            !leftAnkle ||
            !rightHip ||
            !rightKnee ||
            !rightAnkle ||
            leftHip.visibility < 0.5 ||
            leftKnee.visibility < 0.5 ||
            leftAnkle.visibility < 0.5 ||
            rightHip.visibility < 0.5 ||
            rightKnee.visibility < 0.5 ||
            rightAnkle.visibility < 0.5
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
            threshold: EXERCISE_CONFIG[currentWorkout.id].downAngle,
        });

        const now = Date.now();

        // Check if in squat position (legs bent)
        if (
            avgLegAngle <= EXERCISE_CONFIG[currentWorkout.id].downAngle &&
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
        }
        // Check if back to standing position
        else if (
            avgLegAngle >= EXERCISE_CONFIG[currentWorkout.id].upAngle &&
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
        // Use direct indices for landmarks
        const leftShoulder = pose[11];
        const leftHip = pose[23];
        const leftKnee = pose[25];

        if (
            !leftShoulder ||
            !leftHip ||
            !leftKnee ||
            leftShoulder.visibility < 0.5 ||
            leftHip.visibility < 0.5 ||
            leftKnee.visibility < 0.5
        )
            return;

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

    const handleExerciseSelect = (exercise) => {
        setSelectedExercise(exercise);
        clearCurrentWorkout();
        // Clear video if one was previously uploaded
        setVideoFile(null);
        if (videoRef.current) {
            videoRef.current.src = "";
        }
    };

    const stopExercise = async () => {
        if (!currentWorkout) return;

        try {
            // Stop video playback first
            if (videoRef.current) {
                videoRef.current.pause();
            }

            // Clear the counting interval
            if (countIntervalRef.current) {
                clearInterval(countIntervalRef.current);
                countIntervalRef.current = null;
            }

            // Cancel any pending animation frames
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
                requestRef.current = null;
            }

            // Cleanup MediaPipe detector
            if (detector) {
                await detector.close();
                setDetector(null);
            }

            // Save workout data
            await addWorkout({
                exerciseId: currentWorkout.id,
                count: currentWorkout.count,
                target: currentWorkout.target,
            });

            // Store name before clearing workout
            const workoutName = currentWorkout.name;
            const workoutCount = currentWorkout.count;

            // Clear the canvas
            const ctx = canvasRef.current?.getContext("2d");
            if (ctx && canvasRef.current) {
                const width = canvasRef.current.width;
                const height = canvasRef.current.height;
                ctx.clearRect(0, 0, width, height);
            }

            // Clear all states
            clearCurrentWorkout();
            setSelectedExercise(null);
            setVideoFile(null);

            // Clear video source
            if (videoRef.current) {
                videoRef.current.removeAttribute("src");
                videoRef.current.load();
            }

            toast.success(
                `Workout completed! You did ${workoutCount} ${workoutName}`
            );
        } catch (error) {
            console.error("Error stopping workout:", error);
            toast.error("Failed to save workout. Please try again.");
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 flex justify-between gap-8">
            {/* Left side - Controls and Information */}
            <div className="w-1/3">
                <h1 className="text-3xl font-bold mb-8">Workout Session</h1>

                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">
                        1. Select Exercise
                    </h2>
                    <div className="flex flex-col gap-4">
                        {exercises.map((exercise) => (
                            <button
                                key={exercise.id}
                                onClick={() => handleExerciseSelect(exercise)}
                                disabled={currentWorkout}
                                className={`px-4 py-2 rounded ${
                                    selectedExercise?.id === exercise.id
                                        ? "bg-primary-500 text-white"
                                        : "bg-gray-200"
                                } ${
                                    currentWorkout
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                }`}
                            >
                                {exercise.name}
                            </button>
                        ))}
                    </div>
                </div>

                {selectedExercise && !currentWorkout && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">
                            2. Upload Video
                        </h2>
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoUpload}
                            className="mb-4"
                        />
                    </div>
                )}

                {currentWorkout && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Progress</h2>
                        <div className="bg-white rounded-lg p-6 shadow-md">
                            <div className="text-3xl font-bold text-center mb-2">
                                {currentWorkout.count} / {currentWorkout.target}
                            </div>
                            <div className="text-lg text-center text-gray-600">
                                {currentWorkout.name}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-center">
                    {!currentWorkout && selectedExercise && videoFile && (
                        <button
                            onClick={startExercise}
                            disabled={isModelLoading}
                            className="w-full px-6 py-3 bg-primary-500 text-white rounded disabled:opacity-50"
                        >
                            {isModelLoading
                                ? "Loading AI Model..."
                                : "3. Start Exercise"}
                        </button>
                    )}
                    {currentWorkout && (
                        <button
                            onClick={stopExercise}
                            className="w-full px-6 py-3 bg-red-500 text-white rounded"
                        >
                            Stop Exercise
                        </button>
                    )}
                </div>
            </div>

            {/* Right side - Video Display */}
            <div className="w-2/3 relative">
                <div className="relative w-full h-0 pb-[56.25%]">
                    <video
                        ref={videoRef}
                        className="absolute top-0 left-0 w-full h-full object-contain rounded-lg shadow-lg"
                        playsInline
                        loop
                    />
                    <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full"
                        style={{ objectFit: "contain" }}
                    />
                </div>
            </div>
        </div>
    );
}
