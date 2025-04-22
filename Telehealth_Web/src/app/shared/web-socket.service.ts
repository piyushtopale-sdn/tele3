import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import io from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})

export class WebSocketService {
  private socket = io(environment.apiUrl);
  isCallBtnClicked = new Subject<boolean>();
  dialogDetails = new Subject<any>();
  callStatus = new Subject<any>();
  isCallPicked = new Subject<boolean>();

  constructor(private router: Router) { }

  isCallStarted(status: boolean) {
    this.isCallBtnClicked.next(status);
  }

  callStartedSubscribe() {
    return this.isCallBtnClicked.asObservable();
  }

  callPickEmit(data) {
    this.socket.emit('call-pick-emit', data);
  }

  sendMessage(data) {
    this.socket.emit('message', data);
  }

  newMessageReceived() {
    const observable = new Observable<{ user: String, message: String }>(observer => {
      this.socket.on('new message', (data) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    return observable;
  }

  callUser(data: any = '') {
    this.socket.emit('call-user', data);
  }

  closeRingerDialog(data) {
    this.socket.emit('close-ringer', data);
  }

  callStatusSubscription() {
    return this.callStatus.asObservable();
  }

  muteTrack(data) {
    this.socket.emit('track-mute', data);
  }

  joinRoom(data) {
    this.socket.emit('join', data);
  }

  endCallEmit(data: any) {
    console.log("call-emit----",data);
    
    this.socket.emit('end-call-emit', data);
  }

  endCall() {
    const observable = new Observable<{ user: String }>(observer => {
      this.socket.on('end-call', (data) => {
        console.log("end-call--on",data);
        
        // if (this.router.url === '/individual-doctor/appointment') {
        //   this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        //     this.router.navigate(['/individual-doctor/appointment']);
        //   });

        // } else {
          // this.router.navigate([`/individual-doctor/waiting-room`])
        // }
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    return observable;
  }

  closeRingerDialogSubscribe() {
    const observable = new Observable<{ user: String }>(observer => {
      this.socket.on('close-ringer-dialog', (data) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    return observable;
  }

  muteSubscription() {
    const observable = new Observable<{ user: String }>(observer => {
      this.socket.on('track-mute-on', (data) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    return observable;
  }

  participantLeft() {
    const observable = new Observable<{ user: String }>(observer => {
      this.socket.on('participant-left', (data) => {

        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    return observable;
  }

  notifyCall() {
    const observable = new Observable<{ user: String }>(observer => {
      this.socket.on('notify-call', (data) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    return observable;
  }

  callReceiveddSubscribe() {
    return this.isCallPicked.asObservable();
  }

  ringingStart(data) {
    this.socket.emit('ringing-start', data);
  }


  callMissed(data) {    
    this.socket.emit('call-missed', data);

  }

  callPicked() {
    const observable = new Observable<{ user: String }>(observer => {
      this.socket.on('call-picked', (data) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    return observable;
  }

  ringingStarted() {
    const observable = new Observable<{ user: String }>(observer => {
      this.socket.on('ringing-started', (data) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    return observable;
  }

  openCallingDialog() {
    return this.dialogDetails.asObservable();
  }

  leaveRoom(data) {
    this.socket.off("new message");
    this.socket.emit('leave', data);
  }

  isCallReceived(status: boolean) {
    this.isCallPicked.next(status);
  }

  connect() {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  openCallerPopup() {
    const observable = new Observable<{ user: String }>(observer => {
      this.socket.on('caller-info', (data) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    return observable;
  }

  addDialogDetails(data: any) {
    this.dialogDetails.next(data);
  }

  changeCallingStatus(status: any) {
    this.callStatus.next(status);
  }

  createChatRoom(data: any) {
    this.socket.emit('create-chat', data);
  }

  getCreateChat(data: any, cb: CallableFunction) {
    this.socket.emit('get-create-chat-room', data);
    // this.socket.on('get-chat-list', (data) => {
    //   cb(data);
    // });
  }

  joinChatRoom(data: any) {
    this.socket.emit('joinChatRoom', data);
  }

  leaveChatRoom(data: any) {
    this.socket.emit('leave-room', data)
  }

  Roomcreated() {
    const observable = new Observable<{ user: String, message: String }>((observer) => {
      this.socket.on('room-created', (data) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    return observable;
  }

  groupRoomcreated() {
    const observable = new Observable<{ user: String, message: String }>((observer) => {
      this.socket.on('group-room-created', (data) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    return observable;
  }

  sendChatMessage(messageData: any) {
    this.socket.emit('new-message', messageData);
  }

  createGroupChatRoom(data: any) {
    this.socket.emit('create-group-chat', data);
  }


  newMessageReceivedata() {
    const observable = new Observable<{ user: String, message: String }>((observer) => {
      this.socket.on('new-message-read', (sendMessagData) => {
        observer.next(sendMessagData);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    return observable;
  }

  receiveNotification() {
    const observable = new Observable<{ user: String }>((observer) => {
      this.socket.on('received-notification', (data) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    return observable;
  }

  addMemberToExistingGroup(data: any) {
    this.socket.emit('add-member-to-group-chat', data);
  }

  addMembersToRoom() {
    const observable = new Observable<{ user: String, message: String }>((observer) => {
      this.socket.on('add-member-to-room', (data) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    return observable;
  }

  receivedNotificationInfo() {
    return new Observable<{ user: String }>((observer) => {
      this.socket.on("recievenoti", (data) => {
        observer.next(data);
      });

      return () => {
        this.socket.disconnect();
      };
    });
  }


  createChatRoomFor_patient_doc(data: any) {
    this.socket.emit('patient-doctor-create-chat', data);
  }

  joinChatRoom_patient_doc(data: any) {
    this.socket.emit('join-chat-room', data);
  }

  leaveChatRoom_patient_doc(data: any) {
    this.socket.emit('leave-chat-room', data)
  }

  readMessageCount(data:any) {    
    this.socket.emit('read-messages-count', data);
  }

  deleteMessage(data:any) {    
    this.socket.emit('delete-message', data);
  }

  receivedMessageDeleteresponse() {
    const observable = new Observable<{ user: String, message: String }>((observer) => {      
      this.socket.on('message-deleted', (data) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    return observable;
  }
}
