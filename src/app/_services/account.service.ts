import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { User } from '../_models/user';
import { ReplaySubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PresenseService } from './presense.service';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  baseUrl = environment.apiUrl;
  // ReplaySubjet is kind of a buffer which will store the value and can be replayed
  // the size of replaysubject is determined by the input value.
  private currentUserSource = new ReplaySubject<User>(1);
  currentUser$ = this.currentUserSource.asObservable();

  constructor(private http: HttpClient, private presense: PresenseService) { }

  login(model: any) {
    return this.http.post(this.baseUrl + 'account/login', model).pipe(
      map((response: User) => {
        if (response) {
          this.setCurrentUser(response);
          this.presense.createHubConnection(response);
        }
      })
    );
  }

  register(model: any){
    return this.http.post(this.baseUrl + 'account/register', model).pipe(
      map((response: User) => {
        if (response) {
          this.setCurrentUser(response);
          this.presense.createHubConnection(response);
        }
        return response;
      })
    );
  }

  setCurrentUser(user: User) {
    user.roles = [];
    const roles = this.getDecodedToken(user.token).role;
    Array.isArray(roles) ? user.roles = roles : user.roles.push(roles);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSource.next(user);
  }

  logout() {
    localStorage.removeItem('user');
    this.currentUserSource.next(null);
    this.presense.stopHubConnection();
  }

  getDecodedToken(token) {
    return JSON.parse(atob(token.split('.')[1]));
  }
}
