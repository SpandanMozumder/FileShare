"use client";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import styles from "@/styles/auth.module.css";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@/redux/store";
import { logIn, logOut } from "@/redux/features/auth-slice";
import io from "socket.io-client";

let socket: any = null;
let apiurl: string = process.env.NEXT_PUBLIC_API_URL || "";

const page = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useAppSelector((state) => state.authReducer);

  const [file, setFile] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [fileName, setFileName] = useState("");

  const onDrop = useCallback((acceptedFiles: any) => {
    setFile(acceptedFiles[0]);
    console.log(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const removeFile = () => {
    setFile(null);
  };

  const viewFile = () => {};

  const [uploading, setUploading] = useState(false);
  const [uploadpercent, setUploadpercent] = useState(0);

  const router = useRouter();

  const handleUpload = async () => {
    if (!email) {
      toast.error("Please enter the receiver's email");
      return;
    }
    if (!file) {
      toast.error("Please select a file to send");
      return;
    }

    let formdata = new FormData();
    formdata.append("receiveremail", email);
    formdata.append("filename", fileName);

    if (file) {
      formdata.append("clientfile", file);
    }

    setUploading(true);
    let req = new XMLHttpRequest();
    req.open('POST', process.env.NEXT_PUBLIC_API_URL + '/file/sharefile', true);
    req.withCredentials = true;

    req.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percent = (event.loaded / event.total) * 100;
        setUploadpercent(Math.round(percent));
        console.log(`Upload progress: ${Math.round(percent)}%`);
      }
    });

    req.upload.addEventListener("load", () => {
      console.log("Upload complete");
      toast.success("File Uploaded Successfully");
    });

    req.upload.addEventListener("error", (error) => {
      console.log("Upload failed:", error);
      toast.error("File Upload Failed");
      setUploading(false);
    });

    req.onreadystatechange = function () {
      if (req.readyState === 4) {
        setUploading(false);
        if (req.status === 200) {
          toast.success("File Uploaded Successfully");

          socket.emit('uploaded', {
            from: auth.user.email,
            to: email,
          })

          router.push("/myfiles");
        } else {
          toast.error("File Upload Failed");
        }
      }
    };
    req.send(formdata);
  };

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
  }, []);

  return (
    <div className={styles.authpage}>
      <div className={styles.authcontainer}>
        <div className={styles.inputcontainer}>
          <label htmlFor="email">Receiver's Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles.inputcontainer}>
          <label htmlFor="filename">File Name</label>
          <input
            type="text"
            id="filename"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
          />
        </div>

        <div className={styles.inputcontainer}>
          {file ? (
            <div className={styles.filecard}>
              <div className={styles.left}>
                <p>{file.name}</p>
                <p>{(file.size / 1024).toFixed(2)}</p>
              </div>

              <div className={styles.right}>
                <svg
                  onClick={removeFile}
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
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>

                <svg
                  onClick={viewFile}
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
              </div>
            </div>
          ) : (
            <div className={styles.dropzone} {...getRootProps()}>
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Drop the files here ...</p>
              ) : (
                <div className={styles.droptext}>
                  <p>Drag 'n' drop some files here</p>
                  <p>or</p>
                  <p>Click here to select files</p>
                </div>
              )}
            </div>
          )}
        </div>

        <button className={styles.button1} type="button" onClick={handleUpload}>
          Send
        </button>

        {uploading && (
          <div className={styles.uploadpopup}>
            <div className={styles.uploadsectionrow}>
              <div className={styles.uploadbar}>
                <div
                  style={{
                    width: `${uploadpercent}%`,
                    backgroundColor: "lightgreen",
                    height: "100%",
                    borderRadius: "5px",
                  }}
                ></div>
              </div>
              <p>{uploadpercent}%</p>
            </div>
            <p>Uploading...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default page;
