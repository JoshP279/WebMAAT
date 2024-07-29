import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../API/api.service';
import { Lecturer} from '../../classes/Lecturer';
import { Module } from '../../classes/Module';
import { Marker } from '../../classes/Marker';
import { Moderator } from '../../classes/Moderator';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editassessment',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './editassessment.component.html',
  styleUrl: './editassessment.component.css'
})
/**
 * EditAssessmentComponent class for editing an assessment
 * OnInit is implemented, to allow for retrieval of data when the component is initialized.
 */
export class EditAssessmentComponent implements OnInit {
  assessmentName: string = '';
  assessmentID: number = 0;
  loading: boolean = false;
  assessmentForm: FormGroup;
  modules: Module[] = [];
  AssessmentName: string = '';
  moderators: Moderator[] = [];
  markers: Marker[] = [];
  TotalMark: number = 0;
  selectedMemoFile: File | null = null;

  /**
   * @param fb - The form builder service for creating form controls
   * @param api  - The API service for making HTTP requests to the server
   * @param router - The router service for navigating between pages
   */
  constructor(private fb: FormBuilder, private api: ApiService, private router: Router) {
    const storedAssessmentID = sessionStorage.getItem('assessmentID');
    const storedAssessmentName = sessionStorage.getItem('assessmentName');
    if (storedAssessmentID !== null) {
      this.assessmentID = parseInt(storedAssessmentID, 0);
    }
    if (storedAssessmentName !== null) {
      this.assessmentName = storedAssessmentName;
    }
    this.assessmentForm = this.fb.group({
      assessmentName: ['', Validators.required],
      module: ['', Validators.required],
      moderator: ['', Validators.required],
      markers: [[], Validators.required],
      totalMarks: [null, [Validators.required, Validators.pattern(/^[1-9]\d*$/)]],
      selectedFile: [null, Validators.required]
    });
  }

  /**
   * Function to handle the initialization of the component.
   * This function fetches the modules, moderators and markers from the server.
   */
  ngOnInit(): void {
    this.fetchData();
  }
  
  fetchData(): void {
    this.getModules();
    this.getModerators();
    this.getMarkers();
  }

  /**
   * Function to fetch the modules from the server.
   * This function sends a GET request to the server to fetch the modules.
   * If the response is successful, the modules are stored in the modules array.
   * If the response is unsuccessful, an error message is displayed.
   */
  getModules(){
    this.api.getModules().subscribe((res: any) => {
      if (res && Array.isArray(res)) {
        this.modules = res.map((module: any) => new Module(module.ModuleCode, module.ModuleName));
      } else {
        alert('No modules found or invalid response format.');
      }
    });
  }

  /**
   * Function to fetch the moderators from the server.
   * This function sends a GET request to the server to fetch the moderators.
   * If the response is successful, the moderators are stored in the moderators array.
   * If the response is unsuccessful, an error message is displayed.
   * The logged in user's email is filtered out from the list of moderators, as a lecturer cannot select themselves as a moderator.
   */
  getModerators(){
    this.api.getModerators().subscribe((res: any) => {
      if (res && Array.isArray(res)) {
        this.moderators = res.map((moderator: any) => new Moderator(moderator.ModEmail));
      } else {
        alert('No moderators found or invalid response format.');
      }
    });
  }

  /**
   * Function to fetch the markers from the server.
   * This function sends a GET request to the server to fetch the markers.
   * If the response is successful, the markers are stored in the markers array.
   * If the response is unsuccessful, an error message is displayed.
   * The logged in user's email is filtered out from the list of markers, as a lecturer cannot select themselves as a marker, since they are already that lecturer.
   * To be clear, the lecturer always has access to assess their own assessments, so they do not need to be added as a marker.
   */
  getMarkers(){
    this.api.getMarkers().subscribe((res: any) => {
      if (res && Array.isArray(res)) {
        this.markers = res.map((marker: any) => new Marker(marker.MarkerEmail, marker.Name, marker.Surname));
      }else{
        alert('No markers found or invalid response format.');
      }
  });
}
  onDashboard(): void {
    this.router.navigateByUrl('/dashboard');
  }

  /**
 * Function to handle the assessment being edited
 * This function is called when the form is updated.
 * If the form is valid, the function sets the loading variable to true, and reads the file selected for the memorandum.
 * The file is read as an array buffer, and the assessment information is created.
 * The assessment information is then sent to the server to edit the assessment.
 * If the response is successful, the function calls the addSubmissions function.
 * If the response is unsuccessful, an error message is displayed.
 * If the form is invalid, an error message is displayed.
 */
  onSubmit(): void {
    if (this.assessmentForm.valid) {
      const reader = new FileReader();
      const file: File = this.assessmentForm.value.selectedFile;
      if (file) {
        reader.onloadend = async () => {
          const fileData = reader.result as ArrayBuffer;
          const byteArray = new Uint8Array(fileData);
          const assessmentInfo = {
            AssessmentID: this.assessmentID,
            MarkerEmail: this.assessmentForm.value.markers,
            AssessmentName: this.assessmentForm.value.assessmentName,
            ModuleCode: this.assessmentForm.value.module,
            Memorandum: byteArray,
            ModEmail: this.assessmentForm.value.moderator,
            TotalMark: this.assessmentForm.value.totalMarks,
            NumSubmissionsMarked: 0,
            TotalNumSubmissions: 0
          };
          try {
            console.log('edits assessment');
            this.api.editAssessment(assessmentInfo).subscribe((res: any) => {
              if (res && res.message === 'Assessment edited successfully') {
                Swal.fire({
                  icon: 'success',
                  title: 'Success',
                  text: 'Assessment updated successfully!',
                  toast: true,
                  position: 'bottom-end',
                  showConfirmButton: false,
                  timer: 3000
                });
              }
              this.router.navigateByUrl('/dashboard');
            });
          } catch (error) {
            alert('Failed to add assessment. Please try again.');
          }
        };

        reader.readAsArrayBuffer(file);
      }
    }
  }
  /**
   * Function to check if a file is a PDF file.
   * @param file - The file to check if it is a PDF file
   * @returns true if the file is a PDF file, false otherwise
   */
  isPDF(file: File): boolean {
    return file.type === 'application/pdf';
  }

  /**
   * Function to check if a file is a ZIP file.
   * @param file - The file to check if it is a ZIP file
   * @returns true if the file is a ZIP file, false otherwise
   */
  isZIP(file: File): boolean {
    return file.type === 'application/zip' || file.type === 'application/x-zip-compressed';
  }
  /**
   * Function to handle the selection of a file for the memorandum.
   * @param event - The event object for the file input
   * This function is called when a file is selected for the memorandum.
   * If the file is a PDF file, the file is stored in the selectedMemoFile variable.
   * If the file is not a PDF file, an error message is displayed.
   */
  onMemoFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && this.isPDF(file)) {
      this.selectedMemoFile = file;
      this.assessmentForm.patchValue({
        selectedMFile: file
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Invalid File Type",
        text: 'Please select a PDF file',
      });
    }
  }
  /**
   * Function to handle the dropping of a file for the memorandum.
   * @param event - The drag event object for when a file is dropped
   * This function is called when a file is dropped for the memorandum.
   * If the file is a PDF file, the file is stored in the selectedMemoFile variable.
   * If the file is not a PDF file, an error message is displayed.
   */
  onMemoDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files[0];
    if (file && this.isPDF(file)) {
      this.selectedMemoFile = file;
      this.assessmentForm.patchValue({
        selectedMFile: file
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Invalid File Type",
        text: 'Please select a PDF file',
      });
    }
    this.removeDragOverClass();
  }

  /**
   * Function to handle the input change event for the total marks input.
   * @param event - The event object for the input element
   * This function is called when the input value changes, and ensures that the input value is a number.
   */
  onInputChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const inputValue = inputElement.value.trim();
    if (isNaN(parseInt(inputValue, 10))) {
      this.assessmentForm.patchValue({
        totalMarks: null
      });
    }
  }

  /**
   * Function to handle the drag over event for the dropzone.
   * @param event - The drag event object for when a file is dragged over the dropzone
   * This function is called when a file is dragged over the dropzone.
   * The function prevents the default behaviour of the event, and stops the event from propagating to other events.
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.addDragOverClass();
  }

  /**
   * Function to handle the drag enter event for the dropzone.
   * @param event - The drag event object for when a file is dragged over the dropzone
   * This function is called when a file is dragged over the dropzone.
   * The function prevents the default behaviour of the event, and stops the event from propagating to other events.
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.removeDragOverClass();
  }

  /**
   * Function to add the dragover class to the dropzone.
   * This function adds the dragover class to the dropzone element.
   * This class is used to indicate that a file is being dragged over the dropzone.
   */
  addDragOverClass(): void {
    const dropzone = document.querySelector('.dropzone');
    dropzone?.classList.add('dragover');
  }

  /**
   * Function to remove the dragover class from the dropzone.
   * This function removes the dragover class from the dropzone element.
   * This class is used to indicate that a file is being dragged over the dropzone.
   */
  removeDragOverClass(): void {
    const dropzone = document.querySelector('.dropzone');
    dropzone?.classList.remove('dragover');
  }
}