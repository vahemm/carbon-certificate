// import {
//   ArgumentsHost,
//   Catch,
//   UnprocessableEntityException,
// } from '@nestjs/common';
// import { BaseExceptionFilter } from '@nestjs/core';
//
// @Catch(ValidationException)
// export class GlobalValidationExceptionFilter extends BaseExceptionFilter {
//   catch(exception: ValidationException, host: ArgumentsHost): any {
//     const next = new UnprocessableEntityException(
//       new ValidationErrorResult(exception.errors),
//     );
//     super.catch(next, host);
//   }
// }
