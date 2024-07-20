import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../API/api.service';
import { Lecturer} from '../../classes/Lecturer';
import { Module } from '../../classes/Module.Code';
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
export class EditAssessmentComponent {
  assessmentName: string = '';
  assessmentID: number = 0;
  loading: boolean = false;
  assessmentForm: FormGroup;
  lecturers: Lecturer[] = [];
  modules: Module[] = [];
  AssessmentName: string = '';
  moderators: Moderator[] = [];
  markers: Marker[] = [];
  TotalMark: number = 0;
  selectedMemoFile: File | null = null;
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
      lecturer: ['', Validators.required],
      assessmentName: ['', Validators.required],
      module: ['', Validators.required],
      moderator: ['', Validators.required],
      markers: [[], Validators.required],
      totalMarks: [null, [Validators.required, Validators.pattern(/^[1-9]\d*$/)]],
      selectedFile: [null, Validators.required]
    });
  }
  ngOnInit(): void {
    this.fetchData();
  }
  
  fetchData(): void {
    this.getModules();
    this.getLecturers();
    this.getModerators();
    this.getMarkers();
  }
  getModules(){
    this.api.getModules().subscribe((res: any) => {
      if (res && Array.isArray(res)) {
        this.modules = res.map((module: any) => new Module(module.ModuleCode, module.ModuleName));
      } else {
        alert('No modules found or invalid response format.');
      }
    });
  }
  getLecturers(){
    this.api.getLecturers().subscribe((res: any) => {
      if (res && Array.isArray(res)) {
        this.lecturers = res.map((lecturer: any) => new Lecturer(lecturer.MarkerEmail));
      } else {
        alert('No lecturers found or invalid response format.');
      }
    });
  }
  getModerators(){
    this.api.getModerators().subscribe((res: any) => {
      if (res && Array.isArray(res)) {
        this.moderators = res.map((moderator: any) => new Moderator(moderator.ModEmail));
      } else {
        alert('No moderators found or invalid response format.');
      }
    });
  }
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
            MarkerEmail: this.assessmentForm.value.lecturer,
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
    onInputChange(event: Event): void {
      const inputElement = event.target as HTMLInputElement;
      const inputValue = inputElement.value.trim();
      if (isNaN(parseInt(inputValue, 10))) {
        this.assessmentForm.patchValue({
          totalMarks: null
        });
      }
    }

    onMemoFileSelected(event: any): void {
      const file: File = event.target.files[0];
      if (file) {
        this.selectedMemoFile = file;
        this.assessmentForm.patchValue({
          selectedFile: file
        });
      } else {
        alert('Invalid file type. Please select a ZIP or PDF file.');
      }
    } 
    
    onMemoDrop(event: DragEvent): void {
      event.preventDefault();
      event.stopPropagation();
      const file = event.dataTransfer?.files[0];
      if (file) {
        this.selectedMemoFile = file;
        this.assessmentForm.patchValue({
          selectedFile: file
        });
      } else {
        alert('Invalid file type. Please select a PDF file.');
      }
      this.removeDragOverClass();
    }

    onDragOver(event: DragEvent): void {
      event.preventDefault();
      event.stopPropagation();
      this.addDragOverClass();
    }
  
    onDragLeave(event: DragEvent): void {
      event.preventDefault();
      event.stopPropagation();
      this.removeDragOverClass();
    }
  
    addDragOverClass(): void {
      const dropzone = document.querySelector('.dropzone');
      dropzone?.classList.add('dragover');
    }
  
    removeDragOverClass(): void {
      const dropzone = document.querySelector('.dropzone');
      dropzone?.classList.remove('dragover');
    }
  }
