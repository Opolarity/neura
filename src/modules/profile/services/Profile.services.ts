import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import { MyProfile, MyProfileUpdate } from "../types/Profile.types";

// `my-profile` resuelve al usuario por el JWT de la sesión: no recibe uid.
export const getMyProfileApi = async (): Promise<MyProfile> => {
  return await invokeFunction<MyProfile>("my-profile", { method: "GET" });
};

export const updateMyProfileApi = async (profileData: MyProfileUpdate) => {
  return await invokeFunction("my-profile", {
    method: "POST",
    body: profileData,
  });
};
