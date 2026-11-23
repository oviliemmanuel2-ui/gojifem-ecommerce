import React from 'react';
import { LoginClient } from './LoginClient';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; reason?: string }>;
}) {
  const params = await searchParams;
  return (
    <LoginClient
      initialRedirect={params?.redirect || null}
      initialReason={params?.reason || null}
    />
  );
}
