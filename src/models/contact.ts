import pool from '../config/database';
import { Contact } from '../types';

export class ContactModel {
  static async findByEmailOrPhone(email: string | null, phoneNumber: string | null): Promise<Contact[]> {
    try {
      const query = `
        SELECT * FROM contacts
        WHERE (email = $1 AND $1 IS NOT NULL) OR (phone_number = $2 AND $2 IS NOT NULL)
        AND deleted_at IS NULL
        ORDER BY created_at ASC
      `;
      const { rows } = await pool.query(query, [email, phoneNumber]);
      
      return rows.map(row => ({
        id: row.id,
        phoneNumber: row.phone_number,
        email: row.email,
        linkedId: row.linked_id,
        linkPrecedence: row.link_precedence as 'primary' | 'secondary',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at
      }));
    } catch (error) {
      console.error('Error finding contacts:', error);
      throw error;
    }
  }

  static async create(
    email: string | null, 
    phoneNumber: string | null, 
    linkedId: number | null, 
    linkPrecedence: 'primary' | 'secondary'
  ): Promise<Contact> {
    try {
      const query = `
        INSERT INTO contacts (email, phone_number, linked_id, link_precedence)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const { rows } = await pool.query(query, [email, phoneNumber, linkedId, linkPrecedence]);
      
      return {
        id: rows[0].id,
        phoneNumber: rows[0].phone_number,
        email: rows[0].email,
        linkedId: rows[0].linked_id,
        linkPrecedence: rows[0].link_precedence as 'primary' | 'secondary',
        createdAt: rows[0].created_at,
        updatedAt: rows[0].updated_at,
        deletedAt: rows[0].deleted_at
      };
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  static async updateLinkPrecedence(id: number, linkedId: number): Promise<void> {
    try {
      const query = `
        UPDATE contacts
        SET link_precedence = 'secondary', 
            linked_id = $1, 
            updated_at = NOW()
        WHERE id = $2
      `;
      
      await pool.query(query, [linkedId, id]);
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  static async findAllLinkedContacts(primaryId: number): Promise<Contact[]> {
    try {
      const query = `
        SELECT * FROM contacts
        WHERE id = $1 OR linked_id = $1
        AND deleted_at IS NULL
        ORDER BY created_at ASC
      `;
      
      const { rows } = await pool.query(query, [primaryId]);
      
      return rows.map(row => ({
        id: row.id,
        phoneNumber: row.phone_number,
        email: row.email,
        linkedId: row.linked_id,
        linkPrecedence: row.link_precedence as 'primary' | 'secondary',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at
      }));
    } catch (error) {
      console.error('Error finding linked contacts:', error);
      throw error;
    }
  }
}