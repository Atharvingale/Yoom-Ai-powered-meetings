import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  pdf,
} from '@react-pdf/renderer';
import { MeetingSummaryResult } from '@/lib/ai/provider';

const BLUE = '#0E78F9';
const DARK = '#1a1a2e';
const GRAY = '#64748b';
const LIGHT_BG = '#f8fafc';

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={{ marginBottom: 8, marginTop: 20 }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: 'bold',
          color: BLUE,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {title}
      </Text>
      <View style={{ height: 1, backgroundColor: BLUE, marginTop: 4, opacity: 0.3 }} />
    </View>
  );
}

function ActionItemTable({ items }: { items: MeetingSummaryResult['action_items'] }) {
  return (
    <View style={{ border: 1, borderColor: '#e2e8f0' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', backgroundColor: '#e2e8f0', padding: 6 }}>
        <Text style={{ flex: 3, fontWeight: 'bold', fontSize: 9, color: DARK }}>Task</Text>
        <Text style={{ flex: 1.5, fontWeight: 'bold', fontSize: 9, color: DARK }}>Assignee</Text>
        <Text style={{ flex: 1, fontWeight: 'bold', fontSize: 9, color: DARK, textAlign: 'right' }}>Status</Text>
      </View>
      {items.map((item, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            padding: 6,
            backgroundColor: i % 2 === 0 ? LIGHT_BG : '#ffffff',
          }}
        >
          <Text style={{ flex: 3, fontSize: 9, color: DARK }}>{item.task}</Text>
          <Text style={{ flex: 1.5, fontSize: 9, color: GRAY }}>{item.assignee || '—'}</Text>
          <Text
            style={{
              flex: 1,
              fontSize: 9,
              textAlign: 'right',
              color: item.status === 'done' ? '#16a34a' : BLUE,
            }}
          >
            {item.status === 'done' ? 'Done' : 'Open'}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SummaryDocument({
  summary,
  meetingTitle,
  meetingDate,
}: {
  summary: MeetingSummaryResult;
  meetingTitle: string;
  meetingDate: Date;
}) {
  return (
    <Document title={`Meeting Summary - ${meetingTitle}`} author="YOOM">
      <Page size="A4" style={{ padding: 40, fontFamily: 'Helvetica' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: BLUE }}>YOOM</Text>
            <Text style={{ fontSize: 9, color: GRAY, marginTop: 2 }}>Meeting Summary</Text>
          </View>
          <Text style={{ fontSize: 9, color: GRAY }}>{formatDate(meetingDate)}</Text>
        </View>

        {/* Divider */}
        <View style={{ height: 2, backgroundColor: BLUE, marginBottom: 20, opacity: 0.2 }} />

        {/* Title */}
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: DARK, marginBottom: 4 }}>
          {meetingTitle}
        </Text>
        <Text style={{ fontSize: 9, color: GRAY, marginBottom: 16 }}>
          Generated with {summary.model}
        </Text>

        {/* Overview */}
        <SectionHeader title="Overview" />
        <Text style={{ fontSize: 10, color: DARK, lineHeight: 1.6 }}>{summary.overview}</Text>

        {/* Action Items */}
        {summary.action_items.length > 0 && (
          <>
            <SectionHeader title="Action Items" />
            <ActionItemTable items={summary.action_items} />
          </>
        )}

        {/* Decisions */}
        {summary.decisions.length > 0 && (
          <>
            <SectionHeader title="Decisions" />
            {summary.decisions.map((d, i) => (
              <View
                key={i}
                style={{ marginBottom: 6, paddingLeft: 10, borderLeft: 2, borderColor: '#a855f7' }}
              >
                <Text style={{ fontSize: 10, color: DARK }}>{d.decision}</Text>
                {d.context && (
                  <Text style={{ fontSize: 8, color: GRAY, marginTop: 2, fontStyle: 'italic' }}>
                    &ldquo;{d.context}&rdquo;
                  </Text>
                )}
              </View>
            ))}
          </>
        )}

        {/* Open Questions */}
        {summary.open_questions.length > 0 && (
          <>
            <SectionHeader title="Open Questions" />
            {summary.open_questions.map((q, i) => (
              <View
                key={i}
                style={{ marginBottom: 6, paddingLeft: 10, borderLeft: 2, borderColor: '#eab308' }}
              >
                <Text style={{ fontSize: 10, color: DARK }}>{q.question}</Text>
                {q.context && (
                  <Text style={{ fontSize: 8, color: GRAY, marginTop: 2, fontStyle: 'italic' }}>
                    {q.context}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}

        {/* Footer */}
        <View
          fixed
          style={{
            position: 'absolute',
            bottom: 40,
            left: 40,
            right: 40,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ fontSize: 8, color: GRAY }}>
            Exported from YOOM on {formatDate(new Date())}
          </Text>
          <Text style={{ fontSize: 8, color: GRAY }}>
            yoom.app
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function exportSummaryAsPDF(
  summary: MeetingSummaryResult,
  meetingTitle: string,
  meetingDate: Date,
): Promise<Blob> {
  const doc = (
    <SummaryDocument summary={summary} meetingTitle={meetingTitle} meetingDate={meetingDate} />
  );

  return pdf(doc).toBlob();
}
