export class Submission{
    submissionID: number;
    studentNumber: string;
    submissionMark: number;
    studentName:string;
    studentSurname:string;
    submissionStatus:string;
    
    constructor(SubmissionID:number,StudentNumber: string, SubmissionMark: number, StudentFirstName:string, StudentLastName:string, SubmissionStatus:string){
        this.submissionID = SubmissionID;
        this.studentNumber = StudentNumber;
        this.submissionMark = SubmissionMark;
        this.studentName = StudentFirstName;
        this.studentSurname = StudentLastName;
        this.submissionStatus = SubmissionStatus;
    }
}