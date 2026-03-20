import axios from "axios";
import auth from "../config/firebase";
import { io } from "socket.io-client";

const baseURL = "http://localhost:3001/api";

const getUserToken = async () => {
  const user = auth.currentUser;
  const token = user && (await user.getIdToken());
  return token;
};

export const initiateSocketConnection = async () => {
  const token = await getUserToken();

  const socket = io("http://localhost:3001", {
    auth: {
      token,
    },
  });

  return socket;
};

const createHeader = async () => {
  const token = await getUserToken();

  const payloadHeader = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  return payloadHeader;
};

export const getAllUsers = async () => {
  const header = await createHeader();

  try {
    const res = await axios.get(`${baseURL}/user`, header);
    return res.data || [];
  } catch (e) {
    return [];
  }
};

export const getUser = async (userId) => {
  const header = await createHeader();

  try {
    const res = await axios.get(`${baseURL}/user/${userId}`, header);
    return res.data;
  } catch (e) {
    console.error("Get User Error:", e);
    return null;
  }
};

export const getUsers = async (users) => {
  const header = await createHeader();

  try {
    const res = await axios.post(`${baseURL}/user/users`, users, header);
    return res.data || [];
  } catch (e) {
    console.error("Get Users Error:", e);
    return [];
  }
};

export const getChatRooms = async (userId) => {
  const header = await createHeader();

  try {
    const res = await axios.get(`${baseURL}/room/${userId}`, header);
    return res.data || [];
  } catch (e) {
    console.error("Get Chat Rooms Error:", e);
    return [];
  }
};

export const getChatRoomOfUsers = async (firstUserId, secondUserId) => {
  const header = await createHeader();

  try {
    const res = await axios.get(
      `${baseURL}/room/${firstUserId}/${secondUserId}`,
      header
    );
    return res.data;
  } catch (e) {
    console.error("Get Chat Room Error:", e);
    return null;
  }
};

export const createChatRoom = async (members) => {
  const header = await createHeader();

  try {
    const res = await axios.post(`${baseURL}/room`, members, header);
    return res.data;
  } catch (e) {
    console.error("Create Chat Room Error:", e);
    throw e;
  }
};

export const getMessagesOfChatRoom = async (chatRoomId, page = 0, limit = 50) => {
  const header = await createHeader();

  try {
    const res = await axios.get(`${baseURL}/message/${chatRoomId}?page=${page}&limit=${limit}`, header);
    return res.data || [];
  } catch (e) {
    console.error("Get Messages Error:", e);
    return [];
  }
};

export const sendMessage = async (messageBody) => {
  const header = await createHeader();

  try {
    const res = await axios.post(`${baseURL}/message`, messageBody, header);
    return res.data;
  } catch (e) {
    console.error("Send Message Error:", e);
    throw e;
  }
};

export const toggleReaction = async (messageId, reactionData) => {
  const header = await createHeader();

  try {
    const res = await axios.post(
      `${baseURL}/message/${messageId}/react`,
      reactionData,
      header
    );
    return res.data;
  } catch (e) {
    console.error("Toggle Reaction Error:", e);
    throw e;
  }
};

export const uploadFile = async (file, onUploadProgress) => {
  const token = await getUserToken();
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await axios.post(`${baseURL}/upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onUploadProgress(percentCompleted);
      },
    });
    return res.data;
  } catch (e) {
    console.error("Upload Service Error:", e);
    throw e;
  }
};

export const editMessage = async (messageId, text) => {
  const header = await createHeader();
  try {
    const res = await axios.put(`${baseURL}/message/${messageId}`, { text }, header);
    return res.data;
  } catch (e) {
    console.error("Edit Service Error:", e);
    throw e;
  }
};

export const deleteMessage = async (messageId) => {
  const header = await createHeader();
  try {
    const res = await axios.delete(`${baseURL}/message/${messageId}`, header);
    return res.data;
  } catch (e) {
    console.error("Delete Service Error:", e);
    throw e;
  }
};

export const markMessageSeen = async (messageId, userId) => {
  const header = await createHeader();
  try {
    const res = await axios.patch(`${baseURL}/message/${messageId}/seen`, { userId }, header);
    return res.data;
  } catch (e) {
    console.error("Seen Service Error:", e);
    throw e;
  }
};

export const deleteChatRoom = async (chatRoomId) => {
  const header = await createHeader();
  try {
    const res = await axios.delete(`${baseURL}/room/${chatRoomId}`, header);
    return res.data;
  } catch (e) {
    console.error("Delete Chat Room Error:", e);
    throw e;
  }
};
