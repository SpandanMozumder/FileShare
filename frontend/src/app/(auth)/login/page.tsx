"use client";

import React from "react";
import styles from "@/styles/auth.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppDispatch, useAppSelector } from "@/redux/store";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { logIn, logOut } from "@/redux/features/auth-slice";

interface FormData {
  email: string;
  password: string;
}

const page = () => {
  const router = useRouter();
  const auth = useAppSelector((state) => state.authReducer);
  const dispatch = useDispatch<AppDispatch>();

  const [formData, setFormData] = React.useState<FormData>({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLogin = async () => {
    if (formData.email === "" || formData.password === "") {
      toast.error("Please fill in all fields");
      return;
    }

    let res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    let data = await res.json();
    if (res.ok) {
      toast.success("Logged in successfully");
      getUserData();
    } else {
      toast.error(data.message);
    }
  };

  const getUserData = async () => {
    let res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/getuser", {
      method: "GET",
      credentials: "include",
    });
    let data = await res.json();

    if(data){
      dispatch(logIn(data.data));
      router.push("/myfiles")
    }
    else{
      dispatch(logOut());
    }
  };

  return (
    <div className={styles.authpage}>
      <div className={styles.authcontainer}>
        <h1>Login</h1>
        <div className={styles.inputcontainer}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>
        <div className={styles.inputcontainer}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={handleInputChange}
          />
        </div>

        <button className={styles.button1} type="button" onClick={handleLogin}>
          Login
        </button>

        <Link href="/signup">Not signed in?</Link>

        <Link href="/forgotpassword">Forgot Password?</Link>
      </div>
    </div>
  );
};

export default page;
