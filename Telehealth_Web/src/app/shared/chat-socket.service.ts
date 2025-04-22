// import { Injectable } from "@angular/core";
// import { Observable, BehaviorSubject, Subject } from "rxjs";
// import io from "socket.io-client";
// import { environment } from "src/environments/environment";
// import { take } from "rxjs/operators";

// @Injectable({
//   providedIn: "root",
// })
// export class ChatSocketService {
//   private socket = io(environment.apiUrl);

//   constructor() {}

//   joinRoom(data: any) {
//     this.socket.emit("join", data);
//   }

//   sendMessage(data: any) {
//     this.socket.emit("message", data);
//   }

//   newMessageReceived() {
//     const observable = new Observable<{ user: String; message: String }>(
//       (observer) => {
//         this.socket.on("new message", (data) => {
//           observer.next(data);
//         });
//         return () => {
//           this.socket.disconnect();
//         };
//       }
//     );
//     return observable;
//   }

//   fetchChats(data: any) {
//     this.socket.emit("fetch-chats", data);
//   }

//   disconnect() {
//     if (this.socket.connected) {
//       this.socket.disconnect();
//     }
//   }

//   connect() {
//     if (!this.socket.connected) {
//       this.socket.connect();
//     }
//   }

//   markMessageAsRead(data: any) {
//     this.socket.emit("mark-as-read", data);
//   }

//   accessChat(data: any) {

//     this.socket.emit("access-chat", data);
//   }

//   receivedCreatedRoom() {
//     const observable = new Observable<{ user: String; message: String }>(
//       (observer) => {
//         this.socket.on("access-user-chat", (data) => {
//           observer.next(data);
//         });
//         return () => {
//           this.socket.disconnect();
//         };
//       }
//     );
//     return observable;
//   }

//   receiveChatList(data: any) {
//     this.socket.emit("fetch-chat-channels", data);
//   }

//   userData() {
//     const observable = new Observable<{ user: String }>((observer) => {
//       this.socket.on("chat-history", (data) => {
//         observer.next(data);
//       });
//       return () => {
//         this.socket.disconnect();
//       };
//     });
//     return observable;
//   }

//   createGroup(data: any) {
//     this.socket.emit("create-group", data);
//   }

//   accessGroupInfo() {
//     const observable = new Observable<{ user: String }>((observer) => {
//       this.socket.on("access-user-group", (data) => {
//         observer.next(data);
//       });
//       return () => {
//         this.socket.disconnect();
//       };
//     });
//     return observable;
//   }

//   updateGroupEmit(data: any) {

//     this.socket.emit("rename", data);
//   }

//   groupDetailsUpdated() {
//     const observable = new Observable<{ user: String }>((observer) => {
//       this.socket.on("group-details-updated", (data) => {
//         observer.next(data);
//       });
//       return () => {
//         this.socket.disconnect();
//       };
//     });
//     return observable;
//   }

//   removeMemberFromGroup(data: any) {
//     this.socket.emit("remove-member", data);
//   }

//   addMemberInGroup(data: any) {
//     this.socket.emit("add-member-ingroup", data);
//   }

//   removedUserData() {
//     const observable = new Observable<{ user: String; message: String }>(
//       (observer) => {
//         this.socket.on("removed-user", (data) => {
//           observer.next(data);
//         });
//         return () => {
//           this.socket.disconnect();
//         };
//       }
//     );
//     return observable;
//   }

//   deleteMessage(data: any) {

//     this.socket.emit("delete-message", data);
//   }

//   deleteMessageSubscription() {
//     const observable = new Observable<{ user: String }>((observer) => {
//       this.socket.on("message-deleted", (data) => {

//         observer.next(data);
//       });
//       return () => {
//         this.socket.disconnect();
//       };
//     });
//     return observable;
//   }

//   deleteChatGroup(data: any) {
//     this.socket.emit("delete-group", data);
//   }

//   receivedNotificationInfo() {
//     return new Observable<{ user: String }>((observer) => {
//       this.socket.on("received-notification", (data) => {
//         observer.next(data);
//       });
      
//       return () => {
//         this.socket.disconnect();
//       };
//     });
//   }
  

//   updatedRoomMembers() {
//     const observable = new Observable<{ user: String }>((observer) => {
//       this.socket.on("updated-room-members", (data) => {

//         observer.next(data);
//       });
//       return () => {
//         this.socket.disconnect();
//       };
//     });
//     return observable;
//   }
// }
