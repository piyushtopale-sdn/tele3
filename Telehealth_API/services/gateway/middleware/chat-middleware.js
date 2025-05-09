import HttpService from "./httpservice";

export const SocketChat = (socket, io) => {
  const activeChatRooms = new Map(); 

  socket.on("join-chat-room", async (userInfo) => {
    socket.join(userInfo.userId);
  });

  socket.on("leave-chat-room", async (userInfo) => {
    socket.leave(userInfo?.userId);
  });

  socket.on("patient-doctor-create-chat", async (data) => {
    try {
      const headers = {
        'Authorization': data.token
      }
      delete data.token
      const chatCreated = await HttpService.postStagingChat('doctor2/create-chat', { data: data }, headers, 'doctorServiceUrl')
      io.in(chatCreated.body.senderID).emit("room-created", chatCreated)
      io.in(chatCreated.body.receiverID).emit("room-created", chatCreated)
    } catch (e) {
      console.error("Something went wrong:", e);
    }
  });

  socket.on("new-message", async (messageData) => {
    try {
      const headers = {
        'Authorization': messageData.token
      }
      if(messageData?.type == 'Superadmin'){
        let sendMessagData = await HttpService.postStagingChat('superadmin/create-message', { data: messageData }, headers, 'superadminServiceUrl')        
        io.in(messageData.senderID).emit("new-message-read", sendMessagData.body);
        io.in(messageData.receiverID).emit("new-message-read", sendMessagData.body);
  
        let saveNotification = await HttpService.postStagingChat('superadmin/save-notification',
          {
            chatId: messageData.chatId,
            created_by: messageData.senderID,
            for_portal_user: messageData.receiverID,
            content: messageData.message,
            notitype: messageData.notitype,
            created_by_type: messageData.created_by_type
          }, headers, 'superadminServiceUrl')
  
        await io.in(messageData?.receiverID).emit("received-notification", saveNotification)
      }else if(messageData?.type == 'Pharmacy'){
        let sendMessagData = await HttpService.postStagingChat('pharmacy/create-message', { data: messageData }, headers, 'pharmacyServiceUrl');

        io.in(messageData.senderID).emit("new-message-read", sendMessagData.body);
        io.in(messageData.receiverID).emit("new-message-read", sendMessagData.body);
  
        let saveNotification = await HttpService.postStagingChat('pharmacy/save-notification',
          {
            chatId: messageData.chatId,
            created_by: messageData.senderID,
            for_portal_user: messageData.receiverID,
            content: messageData.message,
            notitype: messageData.notitype,
            created_by_type: messageData.created_by_type
          }, headers, 'pharmacyServiceUrl')
  
        await io.in(messageData?.receiverID).emit("received-notification", saveNotification)
      }else if(messageData?.type == 'Doctor'){
        let sendMessagData = await HttpService.postStagingChat('doctor2/create-message', { data: messageData }, headers, 'doctorServiceUrl');        
        io.in(messageData?.senderID).emit("new-message-read", sendMessagData?.body);
        io.in(messageData?.receiverID).emit("new-message-read", sendMessagData?.body);

        const isChatOpen = activeChatRooms.get(messageData?.receiverID) === messageData?.chatId;

        let saveNotification = await HttpService.postStagingChat('doctor2/save-notification',
          {
            chatId: messageData?.chatId,
            created_by: messageData?.senderID,
            for_portal_user: messageData?.receiverID,
            content: messageData?.message,
            notitype: messageData?.notitype,
            created_by_type: messageData?.created_by_type,
            skipPush: isChatOpen
          }, headers, 'doctorServiceUrl')
        
       io.in(messageData?.receiverID).emit("received-notification", saveNotification)

      }else if(messageData?.type == 'Laboratory' || messageData?.type == 'Radiology'){

        let sendMessagData;
        sendMessagData = await HttpService.postStagingChat('labradio/create-message', { data: messageData }, headers, 'labradioServiceUrl');
        io.in(messageData?.senderID).emit("new-message-read", sendMessagData?.body);
        io.in(messageData?.receiverID).emit("new-message-read", sendMessagData?.body);

        let saveNotification = await HttpService.postStagingChat('labradio/save-notification',
          {
            chatId: messageData?.chatId,
            created_by: messageData?.senderID,
            for_portal_user: messageData?.receiverID,
            content: messageData?.message,
            notitype: messageData?.notitype,
            created_by_type: messageData?.created_by_type
          }, headers, 'labradioServiceUrl')
  
        await io.in(messageData?.receiverID).emit("received-notification", saveNotification)
      }
      
    } catch (e) {
      console.error("Something went wrong:", e);
    }
  });

  socket.on("total-messages-count", async (messageData) => {
    try {        
      if (!messageData?.token) {
        return;
      }
      
      const headers = {
        Authorization: messageData.token
      };
  
      const sendMessageData = await HttpService.getTotalMessagesCount(
        "doctor2/total-message-count",
        {userID: messageData?.userID},
        headers,
        "doctorServiceUrl"
      );
    
      if (sendMessageData?.body !== undefined) {
        io.to(messageData?.userID).emit("get-total-messages-count", sendMessageData.body);
      }
    } catch (error) {
      console.error("Error in total-messages-count event:", error);
    }
  });  

  socket.on("read-messages-count", async (messageData) => {
    try {              
      if (!messageData?.token) {
        console.log("Missing authorization token");
        return;
      }
      
      const headers = {
        Authorization: messageData.token
      };
  
      await HttpService.readMessagesCount(
        "doctor2/read-message-count",
        {chatID: messageData.chatID},
        headers,
        "doctorServiceUrl"
      );      
    } catch (error) {
      console.error("Error in total-messages-count event:", error);
    }
  }); 

  //Not in use - Need to verify once
  socket.on("patient-doctor-message", async (messageData) => {
    try {
      const headers = {
        'Authorization': messageData.token
      }
      let sendMessagData = await HttpService.postStagingChat('doctor2/create-message', { data: messageData }, headers, 'doctorServiceUrl');
        
      io.in(messageData?.senderID).emit("new-message-read", sendMessagData?.body);
      io.in(messageData?.receiverID).emit("new-message-read", sendMessagData?.body);

      let saveNotification = await HttpService.postStagingChat('doctor2/save-notification',
        {
          chatId: messageData?.chatId,
          created_by: messageData?.senderID,
          for_portal_user: messageData?.receiverID,
          content: messageData?.message,
          notitype: messageData?.notitype,
          created_by_type: messageData?.created_by_type
        }, headers, 'doctorServiceUrl')

      await io.in(messageData?.receiverID).emit("received-notification", saveNotification)

    } catch (e) {
      console.error("Something went wrong:", e);
    }
  });

  //Not in use - Need to verify once
  socket.on("create-chat", async (data) => {
    try {
      const headers = {
        'Authorization': data.token
      }
       
      if(data.type == 'Superadmin'){
        let createChat = await HttpService.postStagingChat('superadmin/create-chat', { data: data }, headers, 'superadminServiceUrl')
        // 
        io.in(createChat.body.senderID).emit("room-created", createChat)

        io.in(createChat.body.receiverID).emit("room-created", createChat)
      }else if(data.type == 'Pharmacy'){
        let createChat = await HttpService.postStagingChat('pharmacy/create-chat', { data: data }, headers, 'pharmacyServiceUrl')
        
        io.in(createChat.body.senderID).emit("room-created", createChat)

        io.in(createChat.body.receiverID).emit("room-created", createChat)
      }else if(data.type == 'Hospital'){
        let createChat;
        createChat = await HttpService.postStagingChat('hospital/create-chat', { data: data }, headers, 'hospitalServiceUrl')
        // 
        io.in(createChat.body.senderID).emit("room-created", createChat)

        io.in(createChat.body.receiverID).emit("room-created", createChat)

        if(data?.portalType == 'Laboratory' || data?.portalType == 'Radiology'){
          createChat = await HttpService.postStagingChat('labradio/create-chat', { data: data }, headers, 'labradioServiceUrl')
          // 
          io.in(createChat?.body?.senderID).emit("room-created", createChat)
          io.in(createChat?.body?.receiverID).emit("room-created", createChat)
        }
      }else if(data?.type == 'Laboratory' || data?.type == 'Radiology'){
        let createChat;
        createChat = await HttpService.postStagingChat('labradio/create-chat', { data: data }, headers, 'labradioServiceUrl')
        // 
        io.in(createChat?.body?.senderID).emit("room-created", createChat)
        io.in(createChat?.body?.receiverID).emit("room-created", createChat)

        if(data?.role === 'HOSPITAL_ADMIN'){
          createChat = await HttpService.postStagingChat('hospital/create-chat', { data: data }, headers, 'hospitalServiceUrl')
          io.in(createChat?.body?.senderID).emit("room-created", createChat)
          io.in(createChat?.body?.receiverID).emit("room-created", createChat)
        }

      }

    } catch (e) {
      console.error("Something went wrong:", e);
    }
  });


  //Not in use - Need to verify once
  socket.on("joinChatRoom", async (userInfo) => {
    const headers = {
      'Authorization': userInfo.token
    }

    socket.join(userInfo.userId);
    if(userInfo.type == 'Superadmin'){
      await HttpService.postStagingChat('superadmin/update-online-status', { id: userInfo.userId, isOnline: true, socketId: socket.id }, headers, 'superadminServiceUrl')
    }else if(userInfo.type == 'Pharmacy'){
      await HttpService.postStagingChat('pharmacy/update-online-status', { id: userInfo.userId, isOnline: true, socketId: socket.id }, headers, 'pharmacyServiceUrl');
    }else if(userInfo.type == 'Hospital'){
      await HttpService.postStagingChat('hospital/update-online-status', { id: userInfo.userId, isOnline: true, socketId: socket.id }, headers, 'hospitalServiceUrl');
    }else if(userInfo.type == 'Laboratory' || userInfo.type == 'Radiology'){
      await HttpService.postStagingChat('labradio/update-online-status', { id: userInfo.userId, isOnline: true, socketId: socket.id }, headers, 'labradioServiceUrl');
    }
  });

  //Not in use - Need to verify once
  socket.on("leave-room", async (userInfo) => {
    const headers = {
      'Authorization': userInfo.token
    }
    socket.leave(userInfo?.userId);
    if(userInfo?.type == 'Superadmin'){
      await HttpService.postStagingChat('superadmin/update-online-status', { id: userInfo.userId, isOnline: false }, headers, 'superadminServiceUrl')
    }else if(userInfo?.type == 'Pharmacy'){
      await HttpService.postStagingChat('pharmacy/update-online-status', { id: userInfo.userId, isOnline: false }, headers, 'pharmacyServiceUrl')
    }else if(userInfo?.type == 'Hospital'){
      await HttpService.postStagingChat('hospital/update-online-status', { id: userInfo.userId, isOnline: false }, headers, 'hospitalServiceUrl')
    }else if(userInfo?.type == 'Laboratory' || userInfo?.type == 'Radiology'){
      await HttpService.postStagingChat('labradio/update-online-status', { id: userInfo.userId, isOnline: false }, headers, 'labradioServiceUrl')
    }

  });

  //Not in use - Need to verify once
  socket.on("create-group-chat", async (data) => {
    try {
      const headers = {
        'Authorization': data.token
      }

      if(data.type == 'Superadmin'){
        let createGroup = await HttpService.postStagingChat('superadmin/create-group-chat', { data: data }, headers, 'superadminServiceUrl')
        // 
  
        io.in(createGroup.body.senderID).emit("group-room-created", createGroup)
  
        io.in(createGroup.body.receiverID).emit("group-room-created", createGroup)
      }else if(data.type == 'Pharmacy'){
        let createGroup = await HttpService.postStagingChat('pharmacy/create-group-chat', { data: data }, headers, 'pharmacyServiceUrl')
        // 
  
        io.in(createGroup.body.senderID).emit("group-room-created", createGroup)
  
        io.in(createGroup.body.receiverID).emit("group-room-created", createGroup)
      }else if(data.type == 'Hospital'){
        let createGroup = await HttpService.postStagingChat('hospital/create-group-chat', { data: data }, headers, 'hospitalServiceUrl')
        // 
  
        io.in(createGroup.body.senderID).emit("group-room-created", createGroup)
  
        io.in(createGroup.body.receiverID).emit("group-room-created", createGroup)
      }else if(data.type == 'Laboratory' || data.type == 'Radiology'){
        let createGroup = await HttpService.postStagingChat('labradio/create-group-chat', { data: data }, headers, 'labradioServiceUrl')
        // 
  
        io.in(createGroup?.body?.senderID).emit("group-room-created", createGroup)
  
        io.in(createGroup?.body?.receiverID).emit("group-room-created", createGroup)
      }
     
    } catch (e) {
      console.error("Something went wrong:", e);
    }
  });

  //Not in use - Need to verify once
  socket.on("add-member-to-group-chat", async (data) => {
    try {
      const headers = {
        'Authorization': data.token
      }

      if(data.type == 'Superadmin'){
        let createGroup = await HttpService.postStagingChat('superadmin/addmembers-to-groupchat', { data: data }, headers, 'superadminServiceUrl')
        // 
  
        io.in(createGroup.body.senderID).emit("add-member-to-room", createGroup)
  
        io.in(createGroup.body.receiverID).emit("add-member-to-room", createGroup)
  
        let saveNotification = await HttpService.postStagingChat('superadmin/save-notification',
          {
            chatId: data.chatId,
            created_by: data.senderID,
            for_portal_user: data.newMembers,
            content: data.message,
            notitype: data.notitype,
            created_by_type: data.created_by_type
          }, headers, 'superadminServiceUrl')
  
        await io.in(data.chatId).emit("received-notification", saveNotification)
      }else if(data.type == 'Pharmacy'){
        let createGroup = await HttpService.postStagingChat('pharmacy/addmembers-to-groupchat', { data: data }, headers, 'pharmacyServiceUrl')
        // 
  
        io.in(createGroup.body.senderID).emit("add-member-to-room", createGroup)
  
        io.in(createGroup.body.receiverID).emit("add-member-to-room", createGroup)
  
        let saveNotification = await HttpService.postStagingChat('pharmacy/save-notification',
          {
            chatId: data.chatId,
            created_by: data.senderID,
            for_portal_user: data.newMembers,
            content: data.message,
            notitype: data.notitype,
            created_by_type: data.created_by_type
          }, headers, 'pharmacyServiceUrl')
  
        await io.in(data.chatId).emit("received-notification", saveNotification)
      }else if(data.type == 'Hospital'){
        let createGroup = await HttpService.postStagingChat('hospital/addmembers-to-groupchat', { data: data }, headers, 'hospitalServiceUrl')
        // 
  
        io.in(createGroup.body.senderID).emit("add-member-to-room", createGroup)
  
        io.in(createGroup.body.receiverID).emit("add-member-to-room", createGroup)
  
        let saveNotification = await HttpService.postStagingChat('hospital/save-notification',
          {
            chatId: data.chatId,
            created_by: data.senderID,
            for_portal_user: data.newMembers,
            content: data.message,
            notitype: data.notitype,
            created_by_type: data.created_by_type
          }, headers, 'hospitalServiceUrl')
  
        await io.in(data.chatId).emit("received-notification", saveNotification)
      }else if(data.type == 'Laboratory' || data.type == 'Radiology'){
        let createGroup = await HttpService.postStagingChat('labradio/addmembers-to-groupchat', { data: data }, headers, 'labradioServiceUrl')
        // 
  
        io.in(createGroup?.body?.senderID).emit("add-member-to-room", createGroup)
  
        io.in(createGroup?.body?.receiverID).emit("add-member-to-room", createGroup)
  
        let saveNotification = await HttpService.postStagingChat('labradio/save-notification',
          {
            chatId: data?.chatId,
            created_by: data?.senderID,
            for_portal_user: data?.newMembers,
            content: data?.message,
            notitype: data?.notitype,
            created_by_type: data?.created_by_type
          }, headers, 'labradioServiceUrl')
  
        await io.in(data?.chatId).emit("received-notification", saveNotification)
      }
     
    } catch (e) {
      console.error("Something went wrong:", e);
    }
  });


  socket.on("delete-message", async (data) => {
  
    try {
      if (!data?.token) {
        console.log("Missing authorization token");
        return;
      }
  
      const headers = {
        Authorization: data.token,
      };
  
      const sendMessageData = await HttpService.putStaging(
        "doctor2/clear-single-message",
        data, // Ensure correct payload shape
        headers,
        "doctorServiceUrl"
      );
  
      if (sendMessageData?.body) {
        io.in(sendMessageData.body.senderID).emit("message-deleted", sendMessageData);
        io.in(sendMessageData.body.receiverID[0]).emit("message-deleted", sendMessageData);
      }
    } catch (error) {
      console.error("Error in delete-message event:", error);
    }
  });


  socket.on('chatroom-open', ({ userId, chatId }) => {    
    activeChatRooms.set(userId, chatId);
  });

  socket.on('chatroom-close', ({ userId }) => {
    activeChatRooms.delete(userId);
  });
  
}






