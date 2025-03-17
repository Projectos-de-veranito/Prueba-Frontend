<p align="center">
  <img src="https://flowchat-rdri.netlify.app/assets/logo-F1-gNZkr.webp" width="200" alt="FlowChat Logo" />
</p>

<p align="center">A modern messaging platform frontend built with <a href="https://reactjs.org" target="_blank">React</a>, TypeScript, and Vite for fast, responsive real-time communication.</p>

<p align="center">
  <a href="https://www.typescriptlang.org/" target="_blank"><img src="https://img.shields.io/badge/TypeScript-4.9.5-blue.svg" alt="TypeScript Version" /></a>
  <a href="https://vitejs.dev/" target="_blank"><img src="https://img.shields.io/badge/Vite-5.0.0-brightgreen.svg" alt="Vite Version" /></a>
  <a href="https://reactjs.org/" target="_blank"><img src="https://img.shields.io/badge/React-18.2.0-blue.svg" alt="React Version" /></a>
</p>

## Description

FlowChat's frontend is a modern, responsive user interface built using React, TypeScript, and Vite. It provides an intuitive experience for real-time messaging, user management, and file sharing while connecting to the FlowChat NestJS backend.

## Project Structure

The frontend follows a feature-based architecture for better organization:

```
src/
├── assets/                # Static assets like images and icons
├── components/            # Reusable UI components
│   ├── auth/
│   |   ├── AuthForm.tsx
│   |   ├── LoginForm.tsx 
│   |   └── RegisterForm.tsx              
│   ├── chat/
│   |   ├── ChatArea.tsx
│   |   └── ChatBox.tsx     
│   ├── layout/ 
│   |   ├── MessageNotification.tsx
│   |   └── Navbar.tsx  
│   ├── AccountSettings.tsx 
│   ├── ChatList.tsx
│   ├── Config.tsx 
│   └── ContactList.tsx           
├── context/               # React context providers
│   ├── AuthContext.tsx
│   ├── ChatContext.tsx
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts         
│   ├── useChat.ts
├── pages/  
│   ├── Dashboard.tsx      # Application pages/routes
│   ├── Login.tsx 
│   ├── NotFound.tsx        
│   ├── Register.tsx       
├── services/              
│   ├── apiService.ts            
│   ├── authService.ts     
│   ├── chatService.ts     
│   ├── userService.ts  
├── store/                
|   ├──useAuthStore.ts
├── types/                 # Entities definitions
|   ├──Chat.entity.ts
|   ├──Contact.entity.ts
|   ├──User.entity.ts
├── utils/
|   ├──supabaseClient.ts                 # Utility functions
├── App.tsx                # Main application component
├── main.tsx               # Application entry point
└── vite-env.d.ts          # Vite environment declarations
```

## Key Features

### 1. Real-time Chat Interface

The chat interface leverages Supabase for real-time communication:

```typescript
// src/components/chat/ChatBox.tsx 
useEffect(() => {
    if (!chat?.id) return;

    console.log('Configurando suscripción para chat:', chat.id);

    const channelName = `messages:${chat.id}:${Date.now()}`;

    const messagesChannel = supabase
      .channel(channelName)
      .on('postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chat.id}`
        },
        (payload) => {
          console.log('Evento recibido:', payload.eventType, payload);

          if (payload.eventType === 'DELETE') {
            console.log('Procesando DELETE:', payload);
            console.log('ID del mensaje eliminado:', payload.old?.id);

            if (payload.old && payload.old.id) {
              setMessages(currentMessages => {
                console.log('Filtrando mensaje:', payload.old.id);
                console.log('Mensajes antes:', currentMessages.length);

                const filtered = currentMessages.filter(msg => {
                  const keep = msg.id !== payload.old.id;
                  if (!keep) console.log('Eliminando mensaje del estado local:', msg.id);
                  return keep;
                });

                console.log('Mensajes después:', filtered.length);
                return filtered;
              });
            }
          } else if (payload.eventType === 'INSERT' && payload.new) {
            setMessages(prevMessages => {
              const filteredMessages = prevMessages.filter(msg => !msg.isTemp);
              return [...filteredMessages, payload.new as Message];
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setMessages(prevMessages =>
              prevMessages.map(msg =>
                msg.id === payload.new.id
                  ? {
                    ...msg,
                    content: payload.new.content,
                    updated_at: payload.new.updated_at,
                    isEdited: payload.new.updated_at !== payload.new.created_at
                  }
                  : msg
              ),
            );
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Limpiando suscripción para chat:', chat.id);
      supabase.removeChannel(messagesChannel);
    };
  }, [chat?.id]);
```

### 2. User Authentication Flow

The authentication system provides secure login and session management:

```typescript
// src/context/AuthContext.tsx
import { createContext, useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { User } from "../types/User.entity";

interface AuthContextType {
  user: User | null;
  updateUser: (updates: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error obteniendo sesión:", error);
        return;
      }

      if (!data?.session) {
        console.log("No hay sesión activa");
        return;
      }

      const userId = data.session.user.id;

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, username, email, avatar_url")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("Error obteniendo usuario desde la DB:", userError);
        return;
      }

      setUser(userData);
    };

    fetchUser();
  }, []);

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    setUser((prevUser) => ({ ...prevUser!, ...updates }));

    await supabase.auth.updateUser({
      data: updates,
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, updateUser, signOut, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 3. Chat Conversation Management

The chat interface manages the conversation display:

```typescript
// src/components/chat/ChatBox.tsx 
const fetchMessages = async (chatId: string) => {
    try {
      const response = await ChatService.getMessages(chatId);
      setMessages(response.map(msg => ({
        ...msg,
        isEdited: msg.updated_at !== null
      })));
    } catch (error: any) {
      setError("Error al cargar los mensajes: " + (error.message || "Desconocido"));
    }
  };
```

### 4. File Upload Functionality

The upload component handles file attachments for messages:

```typescript
// src/services/chatService.ts
async uploadFile(file: File, userId: string, chatId: string): Promise<string> {
    const bucketName = "uploads";
    const filePath = `${userId}-${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (uploadError) throw new Error("Error al subir archivo: " + uploadError.message);

    const { error: insertError } = await supabase.from("uploads").insert({
      user_id: userId,
      chat_id: chatId,
      file_url: filePath,
      file_type: file.type
    });

    if (insertError) throw new Error("Error al guardar metadatos: " + insertError.message);

    return filePath;
  }
```

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run dev

# build for production
$ npm run build

# preview production build
$ npm run preview
```

## Testing

```bash
# unit tests
$ npm run test

# component tests
$ npm run test:component

# e2e tests with Cypress
$ npm run test:e2e
```

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_BACKEND_URL=your_deployed_backend_url
VITE_IMGBB_KEY=your_imgbb_key
```

## ESLint Configuration

FlowChat frontend uses a robust ESLint configuration:

```js
export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
)
```

## Browser Support

FlowChat supports all modern browsers:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
