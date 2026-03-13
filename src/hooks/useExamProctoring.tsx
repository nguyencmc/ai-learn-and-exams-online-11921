import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProctorEvent {
  type: 'tab_switch' | 'window_blur' | 'face_not_detected' | 'multiple_faces' | 'snapshot' | 'session_start' | 'session_end' | 'camera_enabled' | 'camera_disabled';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface UseExamProctoringOptions {
  examId: string;
  userId: string;
  enabled?: boolean;
  onViolation?: (event: ProctorEvent) => void;
  snapshotInterval?: number; // in milliseconds
  maxViolations?: number; // max violations before auto-flagging
}

// Rate limiting: minimum interval between violation reports (ms)
const MIN_VIOLATION_INTERVAL = 3000;

// Generate a cryptographically random suffix for snapshot file names
function randomSuffix(): string {
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(36)).join('').slice(0, 10);
}

export function useExamProctoring({
  examId,
  userId,
  enabled = true,
  onViolation,
  snapshotInterval = 60000, // 1 minute default
  maxViolations = 50,
}: UseExamProctoringOptions) {
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [violations, setViolations] = useState<ProctorEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const snapshotIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const attemptIdRef = useRef<string | null>(null);
  const lastViolationTimeRef = useRef<number>(0);

  // Set attempt ID for logging
  const setAttemptId = useCallback((id: string) => {
    attemptIdRef.current = id;
  }, []);

  // Log proctoring event to database
  const logEvent = useCallback(async (event: ProctorEvent, snapshotUrl?: string) => {
    if (!enabled || !userId) return;

    try {
      const insertData: Record<string, unknown> = {
        exam_id: examId,
        user_id: userId,
        event_type: event.type,
        snapshot_url: snapshotUrl || null,
        metadata: event.metadata || {},
      };
      
      if (attemptIdRef.current) {
        insertData.exam_attempt_id = attemptIdRef.current;
      }
      
      await supabase.from('exam_proctoring_logs').insert(insertData as never);
    } catch (error) {
      console.error('Failed to log proctoring event:', error);
    }
  }, [enabled, examId, userId]);

  // Capture snapshot from camera
  const captureSnapshot = useCallback(async (eventType: ProctorEvent['type'] = 'snapshot'): Promise<string | null> => {
    if (!videoRef.current || !canvasRef.current || !cameraEnabled) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context || video.videoWidth === 0) return null;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }

        try {
          const timestamp = Date.now();
          // Use random suffix to prevent predictable snapshot paths
          const suffix = randomSuffix();
          const fileName = `${userId}/${examId}/${timestamp}_${suffix}_${eventType}.jpg`;
          
          const { error: uploadError } = await supabase.storage
            .from('exam-proctoring')
            .upload(fileName, blob, {
              contentType: 'image/jpeg',
              cacheControl: '3600',
            });

          if (uploadError) {
            console.error('Failed to upload snapshot:', uploadError);
            resolve(null);
            return;
          }

          // Get the path (not public URL since bucket is private)
          resolve(fileName);
        } catch (error) {
          console.error('Error capturing snapshot:', error);
          resolve(null);
        }
      }, 'image/jpeg', 0.8);
    });
  }, [cameraEnabled, userId, examId]);

  // Handle violation event with rate limiting
  const handleViolation = useCallback(async (event: ProctorEvent) => {
    // Rate limiting: prevent spam violations
    const now = Date.now();
    if (now - lastViolationTimeRef.current < MIN_VIOLATION_INTERVAL) {
      return;
    }
    lastViolationTimeRef.current = now;

    setViolations(prev => {
      // Cap violations to prevent unlimited growth
      if (prev.length >= maxViolations) {
        console.warn(`Proctoring: max violations (${maxViolations}) reached, new violation dropped:`, event.type);
        return prev;
      }
      return [...prev, event];
    });
    
    // Capture snapshot on violation
    const snapshotUrl = await captureSnapshot(event.type);
    await logEvent(event, snapshotUrl || undefined);
    
    onViolation?.(event);
  }, [captureSnapshot, logEvent, onViolation, maxViolations]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setIsProcessing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      setCameraStream(stream);
      setCameraEnabled(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const event: ProctorEvent = {
        type: 'camera_enabled',
        timestamp: new Date(),
      };
      await logEvent(event);
      
      toast.success('Camera đã được bật');
      return true;
    } catch (error) {
      console.error('Failed to start camera:', error);
      toast.error('Không thể bật camera. Vui lòng kiểm tra quyền truy cập.');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [logEvent]);

  // Stop camera
  const stopCamera = useCallback(async () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setCameraEnabled(false);

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      const event: ProctorEvent = {
        type: 'camera_disabled',
        timestamp: new Date(),
      };
      await logEvent(event);
    }
  }, [cameraStream, logEvent]);

  // Set video element ref
  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;
    if (element && cameraStream) {
      element.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Set canvas element ref (for capturing)
  const setCanvasRef = useCallback((element: HTMLCanvasElement | null) => {
    canvasRef.current = element;
  }, []);

  // Monitor tab visibility
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation({
          type: 'tab_switch',
          timestamp: new Date(),
          metadata: { action: 'left_tab' },
        });
      }
    };

    const handleBlur = () => {
      handleViolation({
        type: 'window_blur',
        timestamp: new Date(),
        metadata: { action: 'window_lost_focus' },
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled, handleViolation]);

  // Periodic snapshots
  useEffect(() => {
    if (!enabled || !cameraEnabled || snapshotInterval <= 0) return;

    snapshotIntervalRef.current = setInterval(async () => {
      const snapshotUrl = await captureSnapshot('snapshot');
      if (snapshotUrl) {
        await logEvent({
          type: 'snapshot',
          timestamp: new Date(),
          metadata: { periodic: true },
        }, snapshotUrl);
      }
    }, snapshotInterval);

    return () => {
      if (snapshotIntervalRef.current) {
        clearInterval(snapshotIntervalRef.current);
      }
    };
  }, [enabled, cameraEnabled, snapshotInterval, captureSnapshot, logEvent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      if (snapshotIntervalRef.current) {
        clearInterval(snapshotIntervalRef.current);
      }
    };
  }, [cameraStream]);

  // Log session start
  const startSession = useCallback(async () => {
    await logEvent({
      type: 'session_start',
      timestamp: new Date(),
    });
  }, [logEvent]);

  // Log session end
  const endSession = useCallback(async () => {
    // Capture final snapshot
    if (cameraEnabled) {
      await captureSnapshot('session_end');
    }
    
    await logEvent({
      type: 'session_end',
      timestamp: new Date(),
      metadata: { totalViolations: violations.length },
    });
    
    await stopCamera();
  }, [logEvent, violations.length, cameraEnabled, captureSnapshot, stopCamera]);

  return {
    cameraEnabled,
    cameraStream,
    violations,
    violationCount: violations.length,
    isProcessing,
    startCamera,
    stopCamera,
    setVideoRef,
    setCanvasRef,
    captureSnapshot,
    startSession,
    endSession,
    setAttemptId,
  };
}
