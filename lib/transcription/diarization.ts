import { RawSegment } from './provider';

export interface DiarizationSegment {
  start_ms: number;
  end_ms: number;
  speaker_label: string;
}

export function mergeDiarization(
  transcriptSegments: RawSegment[],
  diarizationSegments?: DiarizationSegment[] | null
): RawSegment[] {
  if (!diarizationSegments || diarizationSegments.length === 0) {
    return transcriptSegments.map((seg) => ({
      ...seg,
      speaker_label: seg.speaker_label ?? null,
    }));
  }

  return transcriptSegments.map((seg) => {
    if (seg.speaker_label) return seg;

    const matchingDiarization = diarizationSegments.find(
      (d) =>
        (seg.start_ms >= d.start_ms && seg.start_ms < d.end_ms) ||
        (seg.end_ms > d.start_ms && seg.end_ms <= d.end_ms) ||
        (d.start_ms >= seg.start_ms && d.end_ms <= seg.end_ms)
    );

    return {
      ...seg,
      speaker_label: matchingDiarization ? matchingDiarization.speaker_label : null,
    };
  });
}
