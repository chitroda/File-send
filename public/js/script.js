jQuery(function($){
    if($('#in_form_wrap').length > 0){
        document.getElementById('in_form_wrap').addEventListener('click', () => {
            document.getElementById('files').click();
        });
    }

    $('#files').on('change', function(e){
        /*var files = e.target.files;
        html = '<div class="display_selected">';

        $.each(files, function(i,data){
            var size = ((data.size)/1024).toFixed(2);
            html += '<div><i class="far fa-file-alt"></i><span>'+data.name+'</span>';
            html += '<span>'+size+'KB</span><button type="button" data-id="'+i+'" class="btn"><i class="fas fa-times"></i></button></div>';
            //console.log(data.name);
        });
        html += '</div>';
        $('#in_form_wrap').hide();
        $('form').append(html);

        if($('#files').get(0).files.length > 0){
            $('body form').append('<input type="submit" name="submit" class="btn btn-primary" value="Upload" style="margin-top: 10px;">');
        }*/
        $('#err_wrap').remove();
        console.log(e.target.files);
        var selected_files = e.target.files;
        var chk_total_size = 0;
        $.each(selected_files, function(i,data){
            chk_total_size += data.size;
        });

        if((((parseInt(chk_total_size))/1024)/1024).toFixed(2) > 1024){
            $('form').append('<div id="err_wrap"><h4 class="text-danger">File size must be less than 2MB</h4></div>');
        }
        else if(chk_total_size == 0){
            $('form').append('<div id="err_wrap"><h4 class="text-danger">Minimum file size should be 1KB</h4></div>');
        }
        else{
            html = '<div class="display_selected">';
            $.each(selected_files, function(i,data){
            if(data.size > 0){
                html += '<div class="file_info"><i class="far fa-file-alt"></i><span>'+data.name+ '</span><span>' +(((parseInt(data.size))/1024)/1024).toFixed(2)+'MB</span><button type="button" data-id="'+i+'" class="btn"><i class="fas fa-times"></i></button></div>';
            }
            });
            html += '</div>';
            $('form').append(html);

            html = '<div class="form-group row" id="download_select"><label class="col-form-label" style="margin-left: 15px; margin-right: 10px;">Expire After </label><select name="expiry_count" class="form-control" style="width: 150px;">'
            for(var i=1; i<=10; i++){
                html += '<option value="'+i+'">'+i+' Download</option>';
            }
            html += '</select><label class="col-form-label" style="margin-left: 5px; margin-right: 5px;">or</label><select name="expiry_time" class="form-control" style="width: 150px;">';
            html += '<option value="5">5 Minutes</option>';
            html += '<option value="60">1 Hour</option>';
            html += '<option value="1440">1 Day</option>';
            html += '</select></div>';
            html += '<input type="submit" name="submit" class="btn btn-primary" value="Upload" style="margin-top: 10px;">';
            $('#in_form_wrap').hide();
            if($('#files').get(0).files.length > 0){
                $('body form').append(html);
            }
        }
    });
    var file_remove_list = [];
    $('body').on('click', '.display_selected button', function(){
        if($('.file_info').length === 1){
            $('.display_selected').remove();
            $('input[type=submit]').remove();
            $('#download_select').remove();
            $('#in_form_wrap').show();
            file_remove_list = [];
        }else{
            var id = $(this).attr('data-id');
            file_remove_list.push(id);
            $(this).parent().remove();
        }
    });
    $('form').submit(function(e){
        $('input[name=removed_file]').val(file_remove_list);
        file_remove_list = [];
    });
});