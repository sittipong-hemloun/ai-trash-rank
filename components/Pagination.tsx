import { Button } from "./ui/button"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPrevious: () => void
  onNext: () => void
}

/**
 * Pagination controls for navigating through pages.
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}) => (
  <div className="mt-4 flex justify-center">
    <Button
      onClick={onPrevious}
      disabled={currentPage === 1}
      className="mr-2"
    >
      ก่อนหน้า
    </Button>
    <span className="mx-2 self-center">
      หน้า {currentPage} จาก {totalPages}
    </span>
    <Button
      onClick={onNext}
      disabled={currentPage === totalPages}
      className="ml-2"
    >
      ถัดไป
    </Button>
  </div>
)

export default Pagination