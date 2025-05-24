import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserList } from "@/components/user-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <main className="container mx-auto py-10 px-4">
      <Tabs defaultValue="users" className="w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <TabsList className="mt-4">
              <Link href="/">
                <TabsTrigger value="users">Users</TabsTrigger>
              </Link>
              <Link href="/artists">
                <TabsTrigger value="artists">Artists</TabsTrigger>
              </Link>
              <Link href="/events">
                <TabsTrigger value="events">Events</TabsTrigger>
              </Link>
            </TabsList>
          </div>
          <Link href="/users/new">
            <Button>Add New User</Button>
          </Link>
        </div>
        <TabsContent value="users" className="mt-0">
          <UserList />
        </TabsContent>
      </Tabs>
    </main>
  )
}
