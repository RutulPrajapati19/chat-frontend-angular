import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { RoomListComponent } from './components/room-list/room-list';
import { ChatRoomComponent } from './components/chat-room/chat-room';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'rooms', component: RoomListComponent, canActivate: [authGuard] },
  { path: 'room/:id', component: ChatRoomComponent, canActivate: [authGuard] }
];