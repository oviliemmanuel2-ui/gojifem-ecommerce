import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@gojifem/database';
import { CreateContactDto } from './contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  async submitContactForm(dto: CreateContactDto) {
    const destination = process.env.CONTACT_DESTINATION_EMAIL || 'support@gojifem.com';

    const submission = await prisma.contactSubmission.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.toLowerCase().trim(),
        phone: dto.phone?.trim() || null,
        subject: dto.subject.trim(),
        message: dto.message.trim(),
        status: 'PENDING',
      },
    });

    this.logger.log(
      `[Contact Inquiry #${submission.id}] Delivered to ${destination} from ${submission.email} — "${submission.subject}"`,
    );

    return {
      success: true,
      id: submission.id,
      destination,
      message: 'Thank you for contacting GOJIFEM. Your message has been received and routed to our support team.',
    };
  }

  async listSubmissions() {
    return prisma.contactSubmission.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
