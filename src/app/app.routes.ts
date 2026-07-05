import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { RoomListComponent } from './components/room-list/room-list';
import { ChatRoomComponent } from './components/chat-room/chat-room';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password';
import { ProfileComponent } from './components/profile/profile';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'rooms', component: RoomListComponent, canActivate: [authGuard] },
  { path: 'room/:id', component: ChatRoomComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] }
];