import { z } from 'zod';
export const loginSchema = z.object({ email: z.email('Informe um e-mail válido'), password: z.string().min(1,'Informe sua senha') });
export const registerSchema = z.object({ name: z.string().trim().min(2,'Digite seu nome'), email: z.email('Informe um e-mail válido'), password: z.string().min(8,'A senha deve ter ao menos 8 caracteres'), confirmPassword: z.string() }).refine(v=>v.password===v.confirmPassword,{path:['confirmPassword'],message:'As senhas não conferem'});
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
