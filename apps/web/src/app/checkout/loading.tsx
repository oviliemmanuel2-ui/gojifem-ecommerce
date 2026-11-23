import React from 'react';
import { CheckoutSkeleton } from '../../components/ui/Skeleton';

export default function CheckoutLoading() {
  return <CheckoutSkeleton message="Preparing your checkout..." />;
}
