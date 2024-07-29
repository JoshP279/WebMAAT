/**
 * Marker class
 * This class is used to create a new Marker object, and stores the email, name and surname of the marker.
 */
export class Marker{
    MarkerEmail: string;
    Name: string;
    Surname: string;
    constructor(MarkerEmail: string, Name: string, Surname: string) {
      this.MarkerEmail = MarkerEmail;
      this.Name = Name;
      this.Surname = Surname;
    }
}