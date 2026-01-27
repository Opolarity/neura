import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Plus, Users } from "lucide-react";
import UsersTable from "../components/users/UsersTable";
import useUsers from "../hooks/useUsers";
import UsersFilterBar from "../components/users/UsersFilterBar";
import UsersHeader from "../components/users/UsersHeader";

const UsersList = () => {
  const {
    users,
    loading,
    search,
    isOpenFilterModal,
    handleSearchChange,
    handleOpenFilterModal,
  } = useUsers();
  return (
    <div className="space-y-6">
      <UsersHeader />

      {/* Users Table */}
      <Card>
        <CardHeader>
          <UsersFilterBar
            search={search}
            handleSearchChange={handleSearchChange}
            onOpen={handleOpenFilterModal}
          ></UsersFilterBar>
          {/*filter bar*/}
        </CardHeader>
        <CardContent className="p-0">
          {/*table*/}
          <UsersTable users={users} loading={loading}></UsersTable>
          {/*pagination bar*/}
        </CardContent>
      </Card>

      {/*users filter modal*/}
    </div>
  );
};

export default UsersList;
