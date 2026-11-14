export type BubbleSize = 'small' | 'medium' | 'large';

export interface CameraState {
  isStreaming: boolean;
  stream: MediaStream | null;
  error: string | null;
  isLoading: boolean;
}
