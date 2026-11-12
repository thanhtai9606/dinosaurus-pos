package docno

import (
	"fmt"
	"time"
)

func OrderNo(date time.Time, dailySeq int32) string {
	return fmt.Sprintf("SO-%s-%04d", date.Format("20060102"), dailySeq)
}

func CustomerCode(seq int64) string {
	return fmt.Sprintf("CUS-%06d", seq)
}

func ProductCode(seq int64) string {
	return fmt.Sprintf("P-%06d", seq)
}
