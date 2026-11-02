export interface HeatmapDay {
  date: string;
  itemCount: number;
  correctCount: number;
  restored?: boolean;
  qualified?: boolean;
}
