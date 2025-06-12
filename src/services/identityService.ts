import { ContactModel } from '../models/contact';
import { IdentifyRequest, IdentifyResponse, Contact } from '../types';

export class IdentityService {
  async identify(data: IdentifyRequest): Promise<IdentifyResponse> {
    try {
      const { email, phoneNumber } = data;
      
      // Validate input - at least one field should be non-null
      if (!email && !phoneNumber) {
        throw new Error('Either email or phoneNumber must be provided');
      }

      // Find contacts that match the email or phone number
      const existingContacts = await ContactModel.findByEmailOrPhone(email || null, phoneNumber || null);
      
      // Case 1: No existing contacts - Create a new primary contact
      if (existingContacts.length === 0) {
        const newContact = await ContactModel.create(email || null, phoneNumber || null, null, 'primary');
        return this.formatResponse(newContact.id);
      }

      // Find all primary contacts in the result
      const primaryContacts = existingContacts.filter(contact => contact.linkPrecedence === 'primary');
      
      // Case 2: Multiple primary contacts need to be consolidated
      if (primaryContacts.length > 1) {
        // Sort by creation date to find the oldest primary contact
        primaryContacts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        
        const oldestPrimary = primaryContacts[0];
        
        // Convert other primaries to secondary linked to the oldest primary
        for (let i = 1; i < primaryContacts.length; i++) {
          await ContactModel.updateLinkPrecedence(primaryContacts[i].id, oldestPrimary.id);
        }
      }

      // Get the primary contact (either the only one or the oldest one)
      const primaryContact = primaryContacts.length > 0 
        ? primaryContacts[0] 
        : existingContacts.find(contact => !contact.linkedId)!;
      
      // Determine the actual primary ID (could be a linked_id for secondary contacts)
      const primaryId = primaryContact.linkPrecedence === 'primary' 
        ? primaryContact.id 
        : primaryContact.linkedId!;
      
      // Check if we need to create a new secondary contact
      const shouldCreateNewSecondary = this.shouldCreateNewSecondaryContact(existingContacts, email, phoneNumber);
      
      if (shouldCreateNewSecondary) {
        await ContactModel.create(email || null, phoneNumber || null, primaryId, 'secondary');
      }
      
      return this.formatResponse(primaryId);
    } catch (error) {
      console.error('Error in identity service:', error);
      throw error;
    }
  }
  
  private shouldCreateNewSecondaryContact(
  existingContacts: Contact[], 
  email: string | null | undefined, 
  phoneNumber: string | null | undefined
): boolean {
  if (!email && !phoneNumber) return false;
  
  // Check if this exact combination of email and phone already exists
  const exactMatchExists = existingContacts.some(
    contact => contact.email === email && contact.phoneNumber === phoneNumber
  );
  
  if (exactMatchExists) return false;
  
  // If we have new information (either email or phone) that doesn't exist in any contact
  const hasNewEmail = email && !existingContacts.some(contact => contact.email === email);
  const hasNewPhone = phoneNumber && !existingContacts.some(contact => contact.phoneNumber === phoneNumber);
  
  // Fix: Ensure we return a boolean value
  return Boolean(hasNewEmail || hasNewPhone);
}
  
  private async formatResponse(primaryId: number): Promise<IdentifyResponse> {
    // Get all contacts linked to this primary ID (including the primary itself)
    const allLinkedContacts = await ContactModel.findAllLinkedContacts(primaryId);
    
    // Find the primary contact
    const primaryContact = allLinkedContacts.find(contact => contact.id === primaryId)!;
    
    // Get all secondary contacts
    const secondaryContacts = allLinkedContacts.filter(
      contact => contact.linkPrecedence === 'secondary'
    );
    
    // Collect unique emails and phone numbers
    const emails: string[] = [];
    const phoneNumbers: string[] = [];
    const secondaryContactIds: number[] = [];
    
    // Add primary contact info first
    if (primaryContact.email) emails.push(primaryContact.email);
    if (primaryContact.phoneNumber) phoneNumbers.push(primaryContact.phoneNumber);
    
    // Add secondary contact info
    for (const contact of secondaryContacts) {
      secondaryContactIds.push(contact.id);
      
      if (contact.email && !emails.includes(contact.email)) {
        emails.push(contact.email);
      }
      
      if (contact.phoneNumber && !phoneNumbers.includes(contact.phoneNumber)) {
        phoneNumbers.push(contact.phoneNumber);
      }
    }
    
    return {
      contact: {
        primaryContactId: primaryId,
        emails,
        phoneNumbers,
        secondaryContactIds
      }
    };
  }
}