import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, handleServerError, requireDatabase } from '../../../../lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const dbMissing = requireDatabase();
  if (dbMissing) return dbMissing;

  try {
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      subject?: string;
      message?: string;
    };

    const name = body.name?.trim() || '';
    const email = body.email?.toLowerCase().trim() || '';
    const phone = body.phone?.trim() || null;
    const subject = body.subject?.trim() || 'Marketplace Inquiry';
    const message = body.message?.trim() || '';

    if (!name) {
      return NextResponse.json({ message: 'Please provide your full name.' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: 'Please provide a valid email address.' }, { status: 400 });
    }
    if (message.length < 10) {
      return NextResponse.json(
        { message: 'Message must be at least 10 characters long.' },
        { status: 400 },
      );
    }

    const destination = process.env.CONTACT_DESTINATION_EMAIL || 'support@gojifem.com';
    const submission = await getPrisma().contactSubmission.create({
      data: {
        name,
        email,
        phone,
        subject,
        message,
        status: 'PENDING',
      },
    });

    return NextResponse.json(
      {
        success: true,
        id: submission.id,
        destination,
        message:
          'Thank you for contacting GOJIFEM. Your message has been received and routed to our support team.',
      },
      { status: 201 },
    );
  } catch (err) {
    return handleServerError(err);
  }
}
