import { ITrip } from '../models/Trip';
import Settings from '../models/Settings.model';
import { parse } from 'date-fns';

/**
 * Convert a time string like "08:30 AM" or "3:30 PM" to a Date object for today.
 * Returns a Date representing the exact start time of the trip.
 */
export async function getTripStartDate(trip: ITrip): Promise<Date> {
  // Fetch system settings (morning start time, etc.)
  const settings = await Settings.findOne();
  const today = new Date();
  const datePart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  let timeStr: string | undefined;
  if (trip.time_slot === 'morning') {
    timeStr = settings?.morningStartTime ?? '08:30 AM';
  } else {
    // Return slot – prefer specificReturnTime, otherwise first option from settings
    timeStr = trip.specificReturnTime ?? settings?.returnTimeOptions?.[0] ?? '03:30 PM';
  }

  // Combine date and time and parse
  const dateTimeStr = `${datePart} ${timeStr}`;
  // Using date-fns parse with format 'yyyy-MM-dd hh:mm a'
  const parsed = parse(dateTimeStr, 'yyyy-MM-dd hh:mm a', new Date());
  return parsed;
}
