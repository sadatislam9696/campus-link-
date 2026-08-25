import { useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

import { AuthContext } from "./AuthContext";
import { SocketContext } from "./SocketContext";
import { API_URL } from "../config";

const SOCKET_URL = API_URL;

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!user || !token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSocket(null);
      setOnlineUsers([]);
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token },
    });

    newSocket.on("onlineUsers", (userIds) => setOnlineUsers(userIds));

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
    // Re-connect only when the logged-in user actually changes (login/logout),
    // not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
