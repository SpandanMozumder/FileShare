"use client";
import styles from "@/styles/myfiles.module.css";
import { useEffect, useState, useMemo, use } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@/redux/store";
import { logIn, logOut } from "@/redux/features/auth-slice";
import io from "socket.io-client";
import { toast } from "react-toastify";
import { emit } from "process";

interface File {
  createdAt: string;
  filename: string;
  fileurl: string;
  filetype: string | null;
  receiveremail: string;
  senderemail: string;
  sharedAt: string;
  updatedAt: string;
  _id: string;
}

let socket: any = null;
let apiurl: string = process.env.NEXT_PUBLIC_API_URL || "";

const Page = () => {
  const router = useRouter();

  const dispatch = useDispatch<AppDispatch>();
  const auth = useAppSelector((state) => state.authReducer);

  const [allFiles, setAllFiles] = useState<File[]>([]);

  const getAllFiles = async () => {
    let res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/file/getfiles", {
      method: "GET",
      credentials: "include",
    });
    let resjson = await res.json();
    if (resjson.ok) {
      console.log(resjson.data);
      setAllFiles(resjson.data);
    }
  };

  const getFileType = (fileurl: any) => {
    const extension = fileurl.split(".").pop().toLowerCase();

    switch (extension) {
      case "mp4":
      case "avi":
      case "mov":
        return "video";

      case "jpeg":
      case "jpg":
      case "png":
      case "gif":
        return "image";

      case "pdf":
      case "doc":
      case "docx":
      case "txt":
        return "document";

      default:
        return "unknown";
    }
  };

  useEffect(() => {
    getAllFiles();
  }, []);

  const [socketId, setSocketId] = useState<string | null>("");

  socket = useMemo(() => io(apiurl), []);

  const getUserData = async () => {
    let res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/getuser", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
    let data = await res.json();

    if (data) {
      dispatch(logIn(data.data));
      return data.data;
    } else {
      dispatch(logOut());
      router.push("/login");
    }
  };

  useEffect(() => {
    socket.on("connect", () => {
      console.log("FT connected", socket.id);
      setSocketId(socket.id);
    });

    if (auth.user) {
      socket.emit("joinself", auth.user.email);
    } else {
      getUserData()
        .then((user) => {
          socket.emit("joinself", user.email);
        })
        .catch((err) => {
          router.push("/login");
        });
    }

    socket.on("notify", (data: any) => {
      toast.info("New File Shared with you" + data.from);
    });
  }, []);

  return (
    <div className={styles.allfiles}>
      <table>
        <thead>
          <tr>
            <th>Filename</th>
            <th>File Type</th>
            <th>Sender Email</th>
            <th>Receiver Email</th>
            <th>Shared At</th>
            <th>View</th>
          </tr>
        </thead>
        <tbody>
          {allFiles
            .sort((a, b) => {
              return (
                new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime()
              );
            })
            .map((file, index) => {
              file.filetype = getFileType(file.fileurl);

              return (
                <tr key={index}>
                  <td>{file.filename}</td>
                  <td>{file.filetype}</td>
                  <td>{file.senderemail}</td>
                  <td>{file.receiveremail}</td>
                  <td>{new Date(file.sharedAt).toLocaleString()} </td>

                  <td>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
};

export default Page;
