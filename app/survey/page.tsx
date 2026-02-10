'use client';

import { useSearchParams } from 'next/navigation';
import SurveyContainer from '@/components/survey/SurveyContainer';

export default function SurveyPage() {
  const searchParams = useSearchParams();
  const org = searchParams.get('org');

  return <SurveyContainer presetOrg={org} />;
}
