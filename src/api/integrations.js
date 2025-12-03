import { brainLane } from './base44Client';
import * as aiService from '../services/aiService';
import * as fileService from '../services/fileService';

export const Core = brainLane.integrations.Core;

export const InvokeLLM = aiService.InvokeLLM;
export const GenerateImage = aiService.GenerateImage;
export const AnalyzeCode = aiService.AnalyzeCode;
export const GenerateTasks = aiService.GenerateTasks;

export const UploadFile = fileService.UploadFile;
export const ExtractZipContents = fileService.ExtractZipContents;
export const ExtractDataFromUploadedFile = fileService.ExtractZipContents;
export const AnalyzeProjectStructure = fileService.AnalyzeProjectStructure;
export const CreateFileSignedUrl = fileService.CreateFileSignedUrl;

// Placeholder for email - can integrate with Resend/SendGrid later
export const SendEmail = async ({ to, subject, body }) => {
  console.log('Email would be sent to:', to, subject);
  return { success: true, message: 'Email functionality coming soon' };
};

// Alias for consistency
export const UploadPrivateFile = UploadFile;






