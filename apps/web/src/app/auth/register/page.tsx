import React from 'react';
import { RegisterClient } from './RegisterClient';

export const dynamic = 'force-dynamic';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; reason?: string }>;
}) {
  const params = await searchParams;
  return (
    <RegisterClient
      initialRedirect={params?.redirect || null}
      initialReason={params?.reason || null}
    />
  );
}
