import { Request, Response, NextFunction } from 'express';
import { IdentityService } from '../services/identityService';
import { IdentifyRequest } from '../types';
import { HttpError } from '../utils/errorHandler';

const identityService = new IdentityService();

export const identifyController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, phoneNumber } = req.body as IdentifyRequest;

    // Normalize phoneNumber to string if it's a number
    const normalizedPhoneNumber = phoneNumber 
      ? String(phoneNumber) 
      : phoneNumber;

    // Basic validation
    if (!email && !normalizedPhoneNumber) {
      throw new HttpError('Either email or phoneNumber must be provided', 400);
    }

    const result = await identityService.identify({ 
      email: email || null, 
      phoneNumber: normalizedPhoneNumber || null 
    });
    
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};