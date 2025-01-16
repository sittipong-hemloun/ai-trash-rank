import Link from "next/link"
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"

const sidebarItems = [
  { href: "/report", label: "รายงานขยะ" },
  { href: "/collect", label: "เก็บขยะ" },
  { href: "/ranking", label: "อันดับ" },
  { href: "/profile", label: "โปรไฟล์" },
]

interface SidebarProps {
  open: boolean
}

/**
 * Sidebar navigation component.
 */
export default function Sidebar({ open }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className={`bg-green-950 border-r pt-12 border-gray-200 text-gray-800 w-64 fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out md:hidden ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <nav className="h-full flex flex-col justify-between">
        <div className="px-4 py-6 space-y-8">
          {sidebarItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={`w-full justify-start py-3 mb-2 ${pathname === item.href
                    ? "text-green-800"
                    : "text-gray-200"
                  }`}
              >
                <span className="text-base">{item.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  )
}